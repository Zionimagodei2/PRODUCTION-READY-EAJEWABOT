import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateLeads } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, location } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY is not configured',
        message: 'To use AI lead generation, please set the GEMINI_API_KEY environment variable. You can get a free API key from https://aistudio.google.com/app/apikey',
      }, { status: 503 })
    }

    // Generate leads using Gemini AI
    const leads = await generateLeads(keyword, location || '')

    // Save the search to the database
    const leadSearch = await db.leadSearch.create({
      data: {
        keyword,
        location: location || '',
        results: JSON.stringify(leads),
        resultCount: leads.length,
      },
    })

    return NextResponse.json({
      id: leadSearch.id,
      keyword,
      location: location || '',
      leads,
      resultCount: leads.length,
      createdAt: leadSearch.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to generate leads' }, { status: 500 })
  }
}
