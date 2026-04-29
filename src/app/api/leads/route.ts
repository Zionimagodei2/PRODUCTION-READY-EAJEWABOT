import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { geminiChat } from '@/lib/gemini'
import { clearCached, getCached, setCached } from '@/lib/simple-cache'

interface ExtractedLead {
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
  source: string
  sourceName: string
  whatsappLink?: string
  hasWhatsApp?: boolean
}

interface WhatsAppGroupLink {
  url: string
  source: string
  sourceName: string
}

// Phone number regex patterns for various formats
const PHONE_PATTERNS = [
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  /(?:tel:|phone:|call:|ph:|tél:|téléphone:)\s*([+\d\s().-]{7,})/gi,
]

// WhatsApp link patterns
const WHATSAPP_PATTERNS = [
  /https?:\/\/wa\.me\/(\d+)/g,
  /https?:\/\/api\.whatsapp\.com\/send\?phone=(\d+)/g,
  /https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/g,
  /https?:\/\/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/g,
]

function extractPhoneNumbers(text: string): string[] {
  const phones: Set<string> = new Set()
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const phone = (match[1] || match[0]).trim()
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15 && !/^\d{4}$/.test(digitsOnly)) {
        phones.add(phone)
      }
    }
  }
  return Array.from(phones)
}

function extractWhatsAppLinks(text: string): { links: string[]; phones: string[]; groupLinks: string[] } {
  const links: string[] = []
  const phones: string[] = []
  const groupLinks: string[] = []

  // wa.me links
  const waMeMatches = text.matchAll(/https?:\/\/wa\.me\/(\d+)/g)
  for (const match of waMeMatches) {
    links.push(match[0])
    phones.push('+' + match[1])
  }

  // api.whatsapp.com links
  const apiMatches = text.matchAll(/https?:\/\/api\.whatsapp\.com\/send\?phone=(\d+)/g)
  for (const match of apiMatches) {
    links.push(match[0])
    phones.push('+' + match[1])
  }

  // chat.whatsapp.com group links
  const groupMatches = text.matchAll(/https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/g)
  for (const match of groupMatches) {
    links.push(match[0])
    groupLinks.push(match[0])
  }

  // whatsapp.com/channel links
  const channelMatches = text.matchAll(/https?:\/\/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/g)
  for (const match of channelMatches) {
    links.push(match[0])
    groupLinks.push(match[0])
  }

  return { links, phones: [...new Set(phones)], groupLinks: [...new Set(groupLinks)] }
}

function extractAddress(text: string, location: string): string {
  const addressLabels = ['address', 'location', 'addr', 'street', 'avenue', 'blvd', 'road', 'suite']
  const lower = text.toLowerCase()

  for (const label of addressLabels) {
    const idx = lower.indexOf(label)
    if (idx !== -1) {
      const chunk = text.slice(idx, idx + 150).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const match = chunk.match(/(?:address|location|addr|street|avenue|blvd|road|suite)[\s:]*([^<\n]{10,100})/i)
      if (match) return match[1].trim()
    }
  }

  return location
}

// Random delay for stealth mode
function stealthDelay(minMs: number = 100, maxMs: number = 300): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Rate-limited concurrency pool
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  maxConcurrent: number,
  processor: (item: T, index: number) => Promise<R>,
  stealthMode: boolean
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises: Promise<R>[] = []

    // Process within batch with limited concurrency
    for (let j = 0; j < batch.length && j < maxConcurrent; j++) {
      const itemIndex = i + j
      batchPromises.push(processor(batch[j], itemIndex))
    }

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Stealth delay between batches
    if (stealthMode && i + batchSize < items.length) {
      await stealthDelay(200, 500)
    }
  }

  return results
}

async function parseScrapedContentWithGemini(
  plainText: string,
  keyword: string,
  location: string,
  sourceUrl: string,
  sourceName: string
): Promise<ExtractedLead | null> {
  const systemPrompt = `You are a data extraction AI. Given real web page text content from a business-related page, extract the business information. Return ONLY a valid JSON object with these fields:
- business: The actual business name found on the page (or "Unknown" if not found)
- phone: The phone number found on the page (or "" if not found)
- category: The business category/type (use the keyword "${keyword}" if unclear)
- rating: A rating if mentioned (0 if not found)
- address: The physical address found on the page (or "" if not found)
- description: A brief 1-sentence description based on actual page content (or "" if not possible)

IMPORTANT: Extract ONLY real information from the text. Do NOT fabricate or guess any data. If the page is not about a specific business, return null.`

  const truncatedText = plainText.slice(0, 3000)

  try {
    const result = await geminiChat(
      [{ role: 'user', content: `Extract business information from this web page text (source: ${sourceUrl}):\n\n${truncatedText}` }],
      systemPrompt,
      { temperature: 0.1, maxOutputTokens: 512 }
    )

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.business && parsed.business !== 'null' && parsed.business !== 'Unknown') {
        return {
          business: parsed.business || 'Unknown',
          phone: parsed.phone || '',
          category: parsed.category || keyword,
          rating: typeof parsed.rating === 'number' ? parsed.rating : 0,
          address: parsed.address || location,
          description: parsed.description || '',
          source: sourceUrl,
          sourceName: sourceName,
        }
      }
    }
  } catch (e) {
    console.error('Gemini parse error:', e)
  }

  return null
}

function extractLeadFromSearchResult(
  name: string,
  snippet: string,
  keyword: string,
  location: string,
  sourceUrl: string,
  sourceName: string
): ExtractedLead {
  const phones = extractPhoneNumbers(snippet)

  return {
    business: name || 'Unknown',
    phone: phones[0] || '',
    category: keyword,
    rating: 0,
    address: location,
    description: snippet || '',
    source: sourceUrl,
    sourceName: sourceName,
  }
}

// Multi-source search queries
function buildSearchQueries(keyword: string, location: string): { query: string; source: string }[] {
  const loc = location ? `in ${location}` : ''
  return [
    { query: `${keyword} business ${loc} phone number address contact`, source: 'google' },
    { query: `site:yelp.com ${keyword} ${loc} phone`, source: 'yelp' },
    { query: `site:yellowpages.com ${keyword} ${loc} phone number`, source: 'yellowpages' },
    { query: `site:tripadvisor.com ${keyword} ${loc} contact phone`, source: 'tripadvisor' },
    { query: `site:facebook.com ${keyword} ${loc} business phone`, source: 'facebook' },
  ]
}

// Auto-save leads to contacts database
async function autoSaveToContacts(leads: ExtractedLead[], keyword: string, location: string): Promise<number> {
  let savedCount = 0
  for (const lead of leads) {
    if (!lead.phone) continue
    try {
      // Check if contact already exists by phone
      const existing = await db.contact.findFirst({
        where: { phone: lead.phone }
      })
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
          }
        })
        savedCount++
      }
    } catch (e) {
      console.error('Auto-save contact error:', e)
    }
  }
  return savedCount
}

// Save discovered WhatsApp group links
async function saveWhatsAppGroups(
  groupLinks: string[],
  keyword: string,
  location: string,
  sourceUrl: string,
  sourceName: string
): Promise<void> {
  for (const link of groupLinks) {
    try {
      const existing = await db.whatsAppGroup.findFirst({
        where: { inviteLink: link }
      })
      if (!existing) {
        await db.whatsAppGroup.create({
          data: {
            name: `Group from ${sourceName}`,
            inviteLink: link,
            category: keyword,
            source: sourceUrl,
            sourceName: sourceName,
            keyword: keyword,
            location: location,
          }
        })
      }
    } catch (e) {
      console.error('Save WhatsApp group error:', e)
    }
  }
}

// GET: Retrieve recent searches
export async function GET() {
  try {
    const cacheKey = 'leads:recent_searches'
    const cached = getCached<{
      searches: Array<{
        id: string
        keyword: string
        location: string
        resultCount: number
        phoneCount: number
        whatsappCount: number
        mode: string
        deepScan: boolean
        sourceBreakdown: Record<string, number>
        createdAt: string
      }>
    }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const searches = await db.leadSearch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

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
      }))
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
    const { keyword, location, deepScan, stealthMode, autoSave } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const isStealth = stealthMode === true
    const shouldAutoSave = autoSave === true
    const shouldDeepScan = deepScan === true

    const zai = await ZAI.create()

    // Step 1: Multi-source parallel search
    const searchQueries = buildSearchQueries(keyword, location || '')
    
    // Execute all searches (with stealth delays if enabled)
    const allSearchResults: Array<{
      url: string
      name: string
      snippet: string
      host_name: string
      rank: number
      date: string
      favicon: string
      source: string
    }> = []

    for (const sq of searchQueries) {
      try {
        if (isStealth) {
          await stealthDelay(100, 300)
        }
        const results = await zai.functions.invoke('web_search', {
          query: sq.query,
          num: 10,
        }) as Array<{
          url: string
          name: string
          snippet: string
          host_name: string
          rank: number
          date: string
          favicon: string
        }>

        if (results && Array.isArray(results)) {
          for (const r of results) {
            allSearchResults.push({ ...r, source: sq.source })
          }
        }
      } catch (e) {
        console.error(`Search error for source ${sq.source}:`, e)
      }
    }

    if (allSearchResults.length === 0) {
      await db.leadSearch.create({
        data: {
          keyword,
          location: location || '',
          results: JSON.stringify([]),
          resultCount: 0,
          phoneCount: 0,
          whatsappCount: 0,
          sourceBreakdown: JSON.stringify({}),
          mode: isStealth ? 'stealth' : 'quick',
          deepScan: shouldDeepScan,
        },
      })
      return NextResponse.json({
        keyword,
        location: location || '',
        leads: [],
        whatsappLinks: [],
        groupLinks: [],
        resultCount: 0,
        phoneCount: 0,
        whatsappCount: 0,
        sources: 0,
        sourceBreakdown: {},
      }, { status: 200 })
    }

    const leads: ExtractedLead[] = []
    const allWhatsappLinks: string[] = []
    const allWhatsappPhones: string[] = []
    const allGroupLinks: string[] = []
    const sourceBreakdown: Record<string, number> = {}

    // Step 2: Process results with batch processing and rate limiting
    const resultsToProcess = allSearchResults.slice(0, shouldDeepScan ? 15 : 20)

    const processResult = async (result: typeof resultsToProcess[0], _index: number): Promise<void> => {
      if (isStealth) {
        await stealthDelay(50, 150)
      }

      // Track source breakdown
      const sourceKey = result.source || 'other'
      sourceBreakdown[sourceKey] = (sourceBreakdown[sourceKey] || 0) + 1

      if (shouldDeepScan) {
        try {
          if (isStealth) {
            await stealthDelay(100, 300)
          }
          const pageData = await zai.functions.invoke('page_reader', {
            url: result.url,
          })

          const plainText = pageData?.data?.html
            ?.replace(/<[^>]*>/g, ' ')
            ?.replace(/&amp;/g, '&')
            ?.replace(/&lt;/g, '<')
            ?.replace(/&gt;/g, '>')
            ?.replace(/&quot;/g, '"')
            ?.replace(/&#39;/g, "'")
            ?.replace(/&nbsp;/g, ' ')
            ?.replace(/\s+/g, ' ')
            ?.trim() || ''

          // Extract WhatsApp links from page
          const waData = extractWhatsAppLinks(plainText)
          if (waData.links.length > 0) {
            allWhatsappLinks.push(...waData.links)
          }
          if (waData.phones.length > 0) {
            allWhatsappPhones.push(...waData.phones)
          }
          if (waData.groupLinks.length > 0) {
            allGroupLinks.push(...waData.groupLinks)
            // Save group links to DB
            await saveWhatsAppGroups(waData.groupLinks, keyword, location || '', result.url, result.host_name)
          }

          if (plainText.length < 50) {
            leads.push(extractLeadFromSearchResult(
              result.name, result.snippet, keyword, location || '', result.url, result.host_name
            ))
            return
          }

          // Extract phone numbers from the page via regex
          const regexPhones = extractPhoneNumbers(plainText)

          // Use Gemini to parse the actual content
          const parsedLead = await parseScrapedContentWithGemini(
            plainText, keyword, location || '', result.url, result.host_name
          )

          if (parsedLead) {
            if (!parsedLead.phone && regexPhones.length > 0) {
              parsedLead.phone = regexPhones[0]
            }
            // Check if this phone was found via WhatsApp link
            if (parsedLead.phone) {
              const digitsOnly = parsedLead.phone.replace(/\D/g, '')
              const isFromWaLink = allWhatsappPhones.some(wp => wp.replace(/\D/g, '').includes(digitsOnly))
              if (isFromWaLink) {
                parsedLead.hasWhatsApp = true
                const waLink = allWhatsappLinks.find(l => {
                  const match = l.match(/wa\.me\/(\d+)/) || l.match(/phone=(\d+)/)
                  return match && digitsOnly.includes(match[1])
                })
                if (waLink) parsedLead.whatsappLink = waLink
              }
            }
            leads.push(parsedLead)
          } else {
            const fallbackLead = extractLeadFromSearchResult(
              result.name, result.snippet, keyword, location || '', result.url, result.host_name
            )
            if (regexPhones.length > 0 && !fallbackLead.phone) {
              fallbackLead.phone = regexPhones[0]
            }
            leads.push(fallbackLead)
          }
        } catch (e) {
          console.error('Page reader error for', result.url, e)
          leads.push(extractLeadFromSearchResult(
            result.name, result.snippet, keyword, location || '', result.url, result.host_name
          ))
        }
      } else {
        // Quick mode: use search result data + check snippet for WhatsApp links
        const waData = extractWhatsAppLinks(result.snippet + ' ' + result.name)
        if (waData.links.length > 0) allWhatsappLinks.push(...waData.links)
        if (waData.phones.length > 0) allWhatsappPhones.push(...waData.phones)
        if (waData.groupLinks.length > 0) {
          allGroupLinks.push(...waData.groupLinks)
          await saveWhatsAppGroups(waData.groupLinks, keyword, location || '', result.url, result.host_name)
        }

        const lead = extractLeadFromSearchResult(
          result.name, result.snippet, keyword, location || '', result.url, result.host_name
        )
        if (lead.phone) {
          const digitsOnly = lead.phone.replace(/\D/g, '')
          const isFromWaLink = allWhatsappPhones.some(wp => wp.replace(/\D/g, '').includes(digitsOnly))
          if (isFromWaLink) {
            lead.hasWhatsApp = true
          }
        }
        leads.push(lead)
      }
    }

    // Process in batches of 5 with max 5 concurrent
    await processInBatches(resultsToProcess, 5, 5, processResult, isStealth)

    // Step 3: Deduplication by phone number AND business name
    const seenPhones = new Set<string>()
    const seenNames = new Set<string>()
    const uniqueLeads = leads.filter(lead => {
      const nameKey = lead.business.toLowerCase().trim()
      const phoneKey = lead.phone ? lead.phone.replace(/\D/g, '') : ''
      
      // Dedup by name
      if (seenNames.has(nameKey)) return false
      seenNames.add(nameKey)
      
      // Also dedup by phone if present
      if (phoneKey && phoneKey.length >= 7) {
        if (seenPhones.has(phoneKey)) return false
        seenPhones.add(phoneKey)
      }
      
      return true
    })

    // Mark leads with WhatsApp if their phone appears in wa.me links
    for (const lead of uniqueLeads) {
      if (lead.phone && !lead.hasWhatsApp) {
        const digitsOnly = lead.phone.replace(/\D/g, '')
        const isFromWaLink = allWhatsappPhones.some(wp => {
          const wpDigits = wp.replace(/\D/g, '')
          return wpDigits === digitsOnly || wpDigits.includes(digitsOnly) || digitsOnly.includes(wpDigits)
        })
        if (isFromWaLink) {
          lead.hasWhatsApp = true
        }
      }
    }

    const phoneCount = uniqueLeads.filter(l => l.phone).length
    const whatsappCount = uniqueLeads.filter(l => l.hasWhatsApp).length

    // Step 4: Auto-save to contacts if enabled
    let autoSavedCount = 0
    if (shouldAutoSave) {
      autoSavedCount = await autoSaveToContacts(uniqueLeads.filter(l => l.phone), keyword, location || '')
    }

    // Step 5: Save search to database
    const leadSearch = await db.leadSearch.create({
      data: {
        keyword,
        location: location || '',
        results: JSON.stringify(uniqueLeads),
        resultCount: uniqueLeads.length,
        phoneCount,
        whatsappCount,
        sourceBreakdown: JSON.stringify(sourceBreakdown),
        mode: isStealth ? 'stealth' : (shouldDeepScan ? 'deep' : 'quick'),
        deepScan: shouldDeepScan,
      },
    })
    clearCached('leads:recent_searches')

    return NextResponse.json({
      id: leadSearch.id,
      keyword,
      location: location || '',
      leads: uniqueLeads,
      whatsappLinks: [...new Set(allWhatsappLinks)],
      groupLinks: [...new Set(allGroupLinks)],
      resultCount: uniqueLeads.length,
      phoneCount,
      whatsappCount,
      sources: allSearchResults.length,
      sourceBreakdown,
      autoSavedCount,
      deepScan: shouldDeepScan,
      stealthMode: isStealth,
      createdAt: leadSearch.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to search leads' }, { status: 500 })
  }
}
