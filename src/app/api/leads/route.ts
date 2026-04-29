import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateLeads } from '@/lib/gemini'
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

function normalizeLead(raw: ExtractedLead, keyword: string, location: string): ExtractedLead {
  const phone = String(raw.phone || '').trim()
  const digitsOnly = phone.replace(/\D/g, '')
  const hasWhatsApp = digitsOnly.length >= 7
  return {
    business: String(raw.business || 'Unknown').trim(),
    phone,
    category: String(raw.category || keyword).trim(),
    rating: Number(raw.rating || 0),
    address: String(raw.address || location).trim(),
    description: String(raw.description || '').trim(),
    source: raw.source || 'gemini',
    sourceName: raw.sourceName || 'Gemini AI',
    hasWhatsApp,
    ...(hasWhatsApp ? { whatsappLink: `https://wa.me/${digitsOnly}` } : {}),
  }
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
            score: lead.rating > 0 ? Math.round(lead.rating * 20) : 50,
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

    const aiLeads = await generateLeads(String(keyword), String(location || ''))
    const normalized = aiLeads
      .map((lead) => normalizeLead(lead as ExtractedLead, keyword, String(location || '')))
      .filter((lead) => lead.business && lead.business !== 'Unknown')

    const seen = new Set<string>()
    const uniqueLeads = normalized.filter((lead) => {
      const key = `${lead.business.toLowerCase()}::${lead.phone.replace(/\D/g, '')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const phoneCount = uniqueLeads.filter((l) => l.phone).length
    const whatsappCount = uniqueLeads.filter((l) => l.hasWhatsApp).length
    const sourceBreakdown = { gemini: uniqueLeads.length }

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
        mode: 'gemini',
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
