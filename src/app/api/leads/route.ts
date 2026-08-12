import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { clearCached, getCached, setCached } from '@/lib/simple-cache'

interface ExtractedLead {
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
  source?: string
  sourceName?: string
  whatsappLink?: string
  hasWhatsApp?: boolean
}

const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/g

function extractPhone(text: string): string {
  const match = text.match(PHONE_RE)?.find((m) => m.replace(/\D/g, '').length >= 7)
  return match ? match.replace(/\s+/g, ' ').trim() : ''
}

function parseDuckDuckGoResults(html: string, keyword: string, location: string): ExtractedLead[] {
  const results: ExtractedLead[] = []
  const blocks = html.split('<article').slice(1)

  for (const block of blocks) {
    const titleMatch = block.match(/result__a[^>]*>(.*?)<\/a>/i)
    const snippetMatch = block.match(/result__snippet[^>]*>(.*?)<\/div>/i)
    const linkMatch = block.match(/href="(https?:\/\/[^"]+)"/i)
    const title = (titleMatch?.[1] || '').replace(/<[^>]*>/g, '').trim()
    const snippet = (snippetMatch?.[1] || '').replace(/<[^>]*>/g, '').trim()
    const url = (linkMatch?.[1] || '').trim()

    if (!title) continue

    const phone = extractPhone(`${title} ${snippet}`)
    const digitsOnly = phone.replace(/\D/g, '')
    const hasWhatsApp = digitsOnly.length >= 7

    results.push({
      business: title,
      phone,
      category: keyword,
      rating: 0,
      address: location || '',
      description: snippet,
      source: url || 'duckduckgo',
      sourceName: 'DuckDuckGo',
      hasWhatsApp,
      ...(hasWhatsApp ? { whatsappLink: `https://wa.me/${digitsOnly}` } : {}),
    })
  }

  return results
}

async function webSearchLeads(keyword: string, location: string): Promise<ExtractedLead[]> {
  const query = `${keyword} ${location} phone address`.trim()
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html',
    },
  })
  if (!res.ok) throw new Error(`Search failed with status ${res.status}`)
  const html = await res.text()
  return parseDuckDuckGoResults(html, keyword, location)
}

async function autoSaveToContacts(leads: ExtractedLead[], keyword: string, location: string): Promise<number> {
  let savedCount = 0
  for (const lead of leads) {
    if (!lead.phone) continue
    try {
      const existing = await db.contact.findFirst({ where: { phone: lead.phone } })
      if (!existing) {
        await db.contact.create({
          data: {
            name: lead.business,
            phone: lead.phone,
            company: lead.business,
            location: lead.address || location,
            tags: `${keyword},lead-scraper,auto-saved`,
            status: 'active',
            score: 50,
          },
        })
        savedCount++
      }
    } catch (e) {
      console.error('Auto-save contact error:', e)
    }
  }
  return savedCount
}

export async function GET() {
  try {
    const cacheKey = 'leads:recent_searches'
    const cached = getCached<{ searches: Array<{ id: string; keyword: string; location: string; resultCount: number; phoneCount: number; whatsappCount: number; mode: string; deepScan: boolean; sourceBreakdown: Record<string, number>; createdAt: string }> }>(cacheKey)
    if (cached) return NextResponse.json(cached)

    const searches = await db.leadSearch.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
    const payload = {
      searches: searches.map(s => ({
        id: s.id,
        keyword: s.keyword,
        location: s.location,
        resultCount: s.resultCount,
        phoneCount: s.phoneCount,
        whatsappCount: s.whatsappCount,
        mode: s.mode,
        deepScan: s.deepScan,
        sourceBreakdown: s.sourceBreakdown ? JSON.parse(s.sourceBreakdown) : {},
        createdAt: s.createdAt.toISOString(),
      })),
    }
    setCached(cacheKey, payload, 30_000)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch searches' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, location, autoSave } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const rawLeads = await webSearchLeads(String(keyword), String(location || ''))

    const seen = new Set<string>()
    const uniqueLeads = rawLeads.filter((lead) => {
      const key = `${lead.business.toLowerCase()}::${lead.phone.replace(/\D/g, '')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const phoneCount = uniqueLeads.filter((l) => l.phone).length
    const whatsappCount = uniqueLeads.filter((l) => l.hasWhatsApp).length
    const sourceBreakdown = { duckduckgo: uniqueLeads.length }

    let autoSavedCount = 0
    if (autoSave === true) {
      autoSavedCount = await autoSaveToContacts(uniqueLeads, keyword, String(location || ''))
    }

    const leadSearch = await db.leadSearch.create({
      data: {
        keyword,
        location: location || '',
        results: JSON.stringify(uniqueLeads),
        resultCount: uniqueLeads.length,
        phoneCount,
        whatsappCount,
        sourceBreakdown: JSON.stringify(sourceBreakdown),
        mode: 'web-search',
        deepScan: false,
      },
    })

    clearCached('leads:recent_searches')

    return NextResponse.json({
      id: leadSearch.id,
      keyword,
      location: location || '',
      leads: uniqueLeads,
      whatsappLinks: uniqueLeads.filter(l => l.whatsappLink).map(l => l.whatsappLink),
      groupLinks: [],
      resultCount: uniqueLeads.length,
      phoneCount,
      whatsappCount,
      sources: uniqueLeads.length,
      sourceBreakdown,
      autoSavedCount,
      deepScan: false,
      stealthMode: false,
      createdAt: leadSearch.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to search leads' }, { status: 500 })
  }
}
