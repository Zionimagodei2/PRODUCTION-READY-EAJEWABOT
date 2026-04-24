import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { geminiChat } from '@/lib/gemini'

interface ExtractedLead {
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
  source: string
  sourceName: string
}

// Phone number regex patterns for various formats
const PHONE_PATTERNS = [
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  /(?:tel:|phone:|call:|ph:|tél:|téléphone:)\s*([+\d\s().-]{7,})/gi,
]

function extractPhoneNumbers(text: string): string[] {
  const phones: Set<string> = new Set()
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const phone = (match[1] || match[0]).trim()
      // Filter out obviously non-phone numbers (too short, or look like dates/years)
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15 && !/^\d{4}$/.test(digitsOnly)) {
        phones.add(phone)
      }
    }
  }
  return Array.from(phones)
}

function extractAddress(text: string, location: string): string {
  // Look for address-like patterns near common labels
  const addressLabels = ['address', 'location', 'addr', 'street', 'avenue', 'blvd', 'road', 'suite']
  const lower = text.toLowerCase()

  for (const label of addressLabels) {
    const idx = lower.indexOf(label)
    if (idx !== -1) {
      // Take a chunk after the label
      const chunk = text.slice(idx, idx + 150).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const match = chunk.match(/(?:address|location|addr|street|avenue|blvd|road|suite)[\s:]*([^<\n]{10,100})/i)
      if (match) return match[1].trim()
    }
  }

  return location
}

async function parseScrapedContentWithGemini(
  plainText: string,
  keyword: string,
  location: string,
  sourceUrl: string,
  sourceName: string
): Promise<ExtractedLead | null> {
  // Use Gemini to PARSE (not fabricate) the real scraped text
  const systemPrompt = `You are a data extraction AI. Given real web page text content from a business-related page, extract the business information. Return ONLY a valid JSON object with these fields:
- business: The actual business name found on the page (or "Unknown" if not found)
- phone: The phone number found on the page (or "" if not found)
- category: The business category/type (use the keyword "${keyword}" if unclear)
- rating: A rating if mentioned (0 if not found)
- address: The physical address found on the page (or "" if not found)
- description: A brief 1-sentence description based on actual page content (or "" if not possible)

IMPORTANT: Extract ONLY real information from the text. Do NOT fabricate or guess any data. If the page is not about a specific business, return null.`

  // Truncate text to avoid token limits
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
  // Quick extraction from search result snippet without deep scraping
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, location, deepScan } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Step 1: Search the web for real businesses
    const searchQuery = `${keyword} business ${location ? `in ${location}` : ''} phone number address contact`
    let searchResults: Array<{
      url: string
      name: string
      snippet: string
      host_name: string
      rank: number
      date: string
      favicon: string
    }> = []

    try {
      searchResults = await zai.functions.invoke('web_search', {
        query: searchQuery,
        num: 15,
      })
    } catch (e) {
      console.error('Web search error:', e)
      return NextResponse.json({
        error: 'Web search failed',
        message: 'Could not perform web search. Please try again later.',
      }, { status: 502 })
    }

    if (!searchResults || searchResults.length === 0) {
      // Save empty search to DB
      await db.leadSearch.create({
        data: {
          keyword,
          location: location || '',
          results: JSON.stringify([]),
          resultCount: 0,
        },
      })
      return NextResponse.json({
        keyword,
        location: location || '',
        leads: [],
        resultCount: 0,
        sources: 0,
      }, { status: 200 })
    }

    const leads: ExtractedLead[] = []
    const shouldDeepScan = deepScan === true

    // Step 2: Process results - either deep scan or quick extraction
    const resultsToProcess = searchResults.slice(0, shouldDeepScan ? 10 : 15)

    for (let i = 0; i < resultsToProcess.length; i++) {
      const result = resultsToProcess[i]

      if (shouldDeepScan) {
        // Deep scan: scrape the page and parse content
        try {
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

          if (plainText.length < 50) {
            // Fall back to search result data
            leads.push(extractLeadFromSearchResult(
              result.name, result.snippet, keyword, location || '', result.url, result.host_name
            ))
            continue
          }

          // Try to extract phone numbers from the page directly via regex
          const regexPhones = extractPhoneNumbers(plainText)

          // Use Gemini to parse the actual content
          const parsedLead = await parseScrapedContentWithGemini(
            plainText, keyword, location || '', result.url, result.host_name
          )

          if (parsedLead) {
            // If regex found phones but Gemini didn't, use the regex result
            if (!parsedLead.phone && regexPhones.length > 0) {
              parsedLead.phone = regexPhones[0]
            }
            leads.push(parsedLead)
          } else {
            // Fall back to search result snippet data
            const fallbackLead = extractLeadFromSearchResult(
              result.name, result.snippet, keyword, location || '', result.url, result.host_name
            )
            if (regexPhones.length > 0) {
              fallbackLead.phone = regexPhones[0]
            }
            leads.push(fallbackLead)
          }
        } catch (e) {
          // Page reader failed, fall back to search result data
          console.error('Page reader error for', result.url, e)
          leads.push(extractLeadFromSearchResult(
            result.name, result.snippet, keyword, location || '', result.url, result.host_name
          ))
        }
      } else {
        // Quick mode: just use search result data
        leads.push(extractLeadFromSearchResult(
          result.name, result.snippet, keyword, location || '', result.url, result.host_name
        ))
      }
    }

    // Deduplicate by business name
    const seen = new Set<string>()
    const uniqueLeads = leads.filter(lead => {
      const key = lead.business.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Save the search to the database
    const leadSearch = await db.leadSearch.create({
      data: {
        keyword,
        location: location || '',
        results: JSON.stringify(uniqueLeads),
        resultCount: uniqueLeads.length,
      },
    })

    return NextResponse.json({
      id: leadSearch.id,
      keyword,
      location: location || '',
      leads: uniqueLeads,
      resultCount: uniqueLeads.length,
      sources: searchResults.length,
      deepScan: shouldDeepScan,
      createdAt: leadSearch.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to search leads' }, { status: 500 })
  }
}
