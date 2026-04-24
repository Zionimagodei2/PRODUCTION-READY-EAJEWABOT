import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { geminiChat } from '@/lib/gemini'

interface DiscoveredGroup {
  name: string
  inviteLink: string
  description: string
  category: string
  members: number
  source: string
  sourceName: string
}

// Extract WhatsApp group invite links from text
function extractInviteLinks(text: string): string[] {
  const links: Set<string> = new Set()
  // Match chat.whatsapp.com invite links
  const patterns = [
    /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,30}/g,
    /https?:\/\/chat\.whatsapp\.com\/invite\/[A-Za-z0-9]{10,30}/g,
  ]
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const link = match[0].replace('/invite/', '/')
      links.add(link)
    }
  }
  return Array.from(links)
}

// Extract group info from scraped page content using Gemini
async function parseGroupInfoFromPage(
  plainText: string,
  sourceUrl: string,
  sourceName: string,
  keyword: string
): Promise<DiscoveredGroup[]> {
  const systemPrompt = `You are a data extraction AI specializing in WhatsApp group information. Given web page text that may contain WhatsApp group invite links and information, extract ALL WhatsApp groups mentioned. Return ONLY a valid JSON array of objects with these fields:
- name: The group name found on the page (or a descriptive name based on context)
- inviteLink: The full chat.whatsapp.com invite link (or "" if not found)
- description: A brief description of the group based on context (or "")
- category: The group category/topic (use "${keyword}" if unclear)
- members: Estimated member count as a number (0 if not mentioned)

IMPORTANT:
- Extract ONLY real groups mentioned on the page
- If no groups are found, return an empty array []
- Do NOT fabricate or guess any data
- If the invite link is not directly visible, leave it as ""`

  const truncatedText = plainText.slice(0, 4000)

  try {
    const result = await geminiChat(
      [{ role: 'user', content: `Extract WhatsApp group information from this web page text (source: ${sourceUrl}):\n\n${truncatedText}` }],
      systemPrompt,
      { temperature: 0.1, maxOutputTokens: 2048 }
    )

    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        return parsed
          .filter((g: Record<string, unknown>) => g.name && g.name !== 'null' && g.name !== 'Unknown')
          .map((g: Record<string, unknown>) => ({
            name: String(g.name || ''),
            inviteLink: String(g.inviteLink || ''),
            description: String(g.description || ''),
            category: String(g.category || keyword),
            members: typeof g.members === 'number' ? g.members : 0,
            source: sourceUrl,
            sourceName: sourceName,
          }))
      }
    }
  } catch (e) {
    console.error('Gemini parse error for groups:', e)
  }

  return []
}

// Quick extraction from search result snippet
function extractGroupFromSnippet(
  name: string,
  snippet: string,
  keyword: string,
  sourceUrl: string,
  sourceName: string
): DiscoveredGroup | null {
  const links = extractInviteLinks(snippet + ' ' + sourceUrl)
  const inviteLink = links.length > 0 ? links[0] : ''

  // Try to extract a group name from the snippet
  const groupNameMatch = snippet.match(/(?:group|grupo|groupe|community)[\s:]*["']?([A-Za-z0-9\s&'-]{3,50})/i)
  const groupName = groupNameMatch ? groupNameMatch[1].trim() : name

  if (!groupName || groupName.length < 2) return null

  // Try to extract member count from snippet
  const memberMatch = snippet.match(/(\d[\d,]+)\s*(?:members?|miembros?|membres?|participants?|people)/i)
  const members = memberMatch ? parseInt(memberMatch[1].replace(/,/g, '')) : 0

  return {
    name: groupName,
    inviteLink,
    description: snippet.slice(0, 200),
    category: keyword,
    members,
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

    // Build multiple search queries to maximize results
    const searchQueries = [
      `"chat.whatsapp.com" ${keyword} group${location ? ` ${location}` : ''}`,
      `whatsapp group invite link ${keyword}${location ? ` ${location}` : ''}`,
      `whatsapp community ${keyword} join link${location ? ` ${location}` : ''}`,
    ]

    const allGroups: DiscoveredGroup[] = []
    const seenLinks = new Set<string>()
    const seenNames = new Set<string>()

    for (const query of searchQueries) {
      try {
        const searchResults = await zai.functions.invoke('web_search', {
          query,
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

        if (!searchResults || searchResults.length === 0) continue

        for (const result of searchResults) {
          // First, extract invite links directly from the search result
          const directLinks = extractInviteLinks(result.snippet + ' ' + result.url)

          if (directLinks.length > 0) {
            // We found direct invite links in the search result
            for (const link of directLinks) {
              if (seenLinks.has(link)) continue
              seenLinks.add(link)

              const groupName = result.name || keyword + ' Group'
              if (seenNames.has(groupName.toLowerCase())) continue
              seenNames.add(groupName.toLowerCase())

              // Try to extract member count from snippet
              const memberMatch = result.snippet.match(/(\d[\d,]+)\s*(?:members?|miembros?|membres?|participants?|people)/i)
              const members = memberMatch ? parseInt(memberMatch[1].replace(/,/g, '')) : 0

              allGroups.push({
                name: groupName,
                inviteLink: link,
                description: result.snippet.slice(0, 200),
                category: keyword,
                members,
                source: result.url,
                sourceName: result.host_name,
              })
            }
          }

          // If deep scan is enabled, scrape pages for more info
          if (deepScan && allGroups.length < 20) {
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

              if (plainText.length < 50) continue

              // Extract invite links from the page content
              const pageLinks = extractInviteLinks(plainText)

              if (pageLinks.length > 0) {
                // Found invite links on the page
                const pageGroups = await parseGroupInfoFromPage(
                  plainText, result.url, result.host_name, keyword
                )

                for (const group of pageGroups) {
                  // Use the extracted link or fall back to page links
                  if (!group.inviteLink && pageLinks.length > 0) {
                    group.inviteLink = pageLinks[0]
                  }

                  const linkKey = group.inviteLink || group.name.toLowerCase()
                  if (group.inviteLink && seenLinks.has(group.inviteLink)) continue
                  if (seenNames.has(group.name.toLowerCase())) continue

                  if (group.inviteLink) seenLinks.add(group.inviteLink)
                  seenNames.add(group.name.toLowerCase())
                  allGroups.push(group)
                }

                // Also add any links found by regex that weren't parsed by Gemini
                for (const link of pageLinks) {
                  if (seenLinks.has(link)) continue
                  seenLinks.add(link)

                  // Try to extract group name from surrounding text
                  const linkIdx = plainText.indexOf(link)
                  const surroundingText = plainText.slice(Math.max(0, linkIdx - 200), linkIdx + link.length + 200)
                  const nameMatch = surroundingText.match(/(?:group|grupo|community)[\s:]*["']?([A-Za-z0-9\s&'-]{3,50})/i)
                  const groupName = nameMatch ? nameMatch[1].trim() : `${keyword} WhatsApp Group`

                  if (!seenNames.has(groupName.toLowerCase())) {
                    seenNames.add(groupName.toLowerCase())
                    allGroups.push({
                      name: groupName,
                      inviteLink: link,
                      description: surroundingText.slice(0, 200).trim(),
                      category: keyword,
                      members: 0,
                      source: result.url,
                      sourceName: result.host_name,
                    })
                  }
                }
              } else if (plainText.toLowerCase().includes('whatsapp')) {
                // Page mentions WhatsApp but no direct links found
                const snippetGroup = extractGroupFromSnippet(
                  result.name, result.snippet, keyword, result.url, result.host_name
                )
                if (snippetGroup && !seenNames.has(snippetGroup.name.toLowerCase())) {
                  seenNames.add(snippetGroup.name.toLowerCase())
                  allGroups.push(snippetGroup)
                }
              }
            } catch (e) {
              // Page reader failed, try quick extraction from snippet
              console.error('Page reader error for', result.url, e)
              const snippetGroup = extractGroupFromSnippet(
                result.name, result.snippet, keyword, result.url, result.host_name
              )
              if (snippetGroup && !seenNames.has(snippetGroup.name.toLowerCase())) {
                seenNames.add(snippetGroup.name.toLowerCase())
                allGroups.push(snippetGroup)
              }
            }
          } else if (!deepScan) {
            // Quick mode: extract from search snippet only
            const snippetGroup = extractGroupFromSnippet(
              result.name, result.snippet, keyword, result.url, result.host_name
            )
            if (snippetGroup && !seenNames.has(snippetGroup.name.toLowerCase())) {
              seenNames.add(snippetGroup.name.toLowerCase())
              allGroups.push(snippetGroup)
            }
          }
        }
      } catch (e) {
        console.error('Search query failed:', query, e)
        // Continue with next query
      }
    }

    // Deduplicate by name
    const uniqueGroups = allGroups.filter((group, index, self) =>
      index === self.findIndex(g => g.name.toLowerCase() === group.name.toLowerCase())
    )

    // Save discovered groups to database
    const savedGroups = []
    for (const group of uniqueGroups) {
      try {
        const saved = await db.whatsAppGroup.create({
          data: {
            name: group.name,
            inviteLink: group.inviteLink,
            description: group.description,
            category: group.category,
            members: group.members,
            source: group.source,
            sourceName: group.sourceName,
            keyword,
            location: location || '',
          },
        })
        savedGroups.push({
          ...group,
          id: saved.id,
          saved: false,
        })
      } catch (e) {
        // DB save failed, still include in results
        console.error('Failed to save group:', group.name, e)
        savedGroups.push(group)
      }
    }

    return NextResponse.json({
      keyword,
      location: location || '',
      groups: savedGroups,
      resultCount: savedGroups.length,
      deepScan: deepScan === true,
    }, { status: 200 })

  } catch (error) {
    console.error('Group search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search for WhatsApp groups' },
      { status: 500 }
    )
  }
}

// GET: Retrieve saved groups from database
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const location = searchParams.get('location') || ''
    const savedOnly = searchParams.get('saved') === 'true'

    const where: Record<string, unknown> = {}
    if (keyword) where.keyword = { contains: keyword }
    if (location) where.location = { contains: location }
    if (savedOnly) where.saved = true

    const groups = await db.whatsAppGroup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      groups,
      count: groups.length,
    }, { status: 200 })
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve groups' },
      { status: 500 }
    )
  }
}

// PUT: Save/unsave a group
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { groupId, saved } = body

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    const updated = await db.whatsAppGroup.update({
      where: { id: groupId },
      data: { saved: saved === true },
    })

    return NextResponse.json({
      group: updated,
      saved: updated.saved,
    }, { status: 200 })
  } catch (error) {
    console.error('Save group error:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}
