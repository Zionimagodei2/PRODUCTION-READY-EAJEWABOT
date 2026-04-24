import { NextResponse } from 'next/server'

interface ValidationRequest {
  numbers: string[]
}

interface ValidationResult {
  number: string
  valid: boolean
  reason?: string
  country?: string
  flag?: string
}

// Country code mappings for validation
const countryCodeMap: Record<string, { name: string; flag: string; pattern: string }> = {
  '1':   { name: 'United States/Canada', flag: '🇺🇸', pattern: '^\\+1[2-9]\\d{9}$' },
  '7':   { name: 'Russia', flag: '🇷🇺', pattern: '^\\+7[3-9]\\d{9}$' },
  '20':  { name: 'Egypt', flag: '🇪🇬', pattern: '^\\+20[1-9]\\d{8}$' },
  '27':  { name: 'South Africa', flag: '🇿🇦', pattern: '^\\+27[1-9]\\d{8}$' },
  '30':  { name: 'Greece', flag: '🇬🇷', pattern: '^\\+30[2-9]\\d{8,9}$' },
  '31':  { name: 'Netherlands', flag: '🇳🇱', pattern: '^\\+31[1-9]\\d{8}$' },
  '33':  { name: 'France', flag: '🇫🇷', pattern: '^\\+33[1-9]\\d{8}$' },
  '34':  { name: 'Spain', flag: '🇪🇸', pattern: '^\\+34[6-9]\\d{8}$' },
  '39':  { name: 'Italy', flag: '🇮🇹', pattern: '^\\+39[3]\\d{8,10}$' },
  '44':  { name: 'United Kingdom', flag: '🇬🇧', pattern: '^\\+44[1-9]\\d{9,10}$' },
  '49':  { name: 'Germany', flag: '🇩🇪', pattern: '^\\+49[1-9]\\d{9,10}$' },
  '52':  { name: 'Mexico', flag: '🇲🇽', pattern: '^\\+52[1-9]\\d{9,10}$' },
  '55':  { name: 'Brazil', flag: '🇧🇷', pattern: '^\\+55[1-9]\\d{9,10}$' },
  '61':  { name: 'Australia', flag: '🇦🇺', pattern: '^\\+61[2-9]\\d{8}$' },
  '62':  { name: 'Indonesia', flag: '🇮🇩', pattern: '^\\+62[1-9]\\d{8,10}$' },
  '63':  { name: 'Philippines', flag: '🇵🇭', pattern: '^\\+63[2-9]\\d{8,9}$' },
  '65':  { name: 'Singapore', flag: '🇸🇬', pattern: '^\\+65[6-9]\\d{7}$' },
  '66':  { name: 'Thailand', flag: '🇹🇭', pattern: '^\\+66[2-9]\\d{7,8}$' },
  '81':  { name: 'Japan', flag: '🇯🇵', pattern: '^\\+81[1-9]\\d{8,9}$' },
  '82':  { name: 'South Korea', flag: '🇰🇷', pattern: '^\\+82[1-9]\\d{7,9}$' },
  '86':  { name: 'China', flag: '🇨🇳', pattern: '^\\+86[1]\\d{10}$' },
  '90':  { name: 'Turkey', flag: '🇹🇷', pattern: '^\\+90[2-9]\\d{9}$' },
  '91':  { name: 'India', flag: '🇮🇳', pattern: '^\\+91[6-9]\\d{9}$' },
  '234': { name: 'Nigeria', flag: '🇳🇬', pattern: '^\\+234[7-9]\\d{9}$' },
  '852': { name: 'Hong Kong', flag: '🇭🇰', pattern: '^\\+852[2-9]\\d{7}$' },
  '853': { name: 'Macau', flag: '🇲🇴', pattern: '^\\+853[6]\\d{7}$' },
  '886': { name: 'Taiwan', flag: '🇹🇼', pattern: '^\\+886[9]\\d{8}$' },
  '971': { name: 'UAE', flag: '🇦🇪', pattern: '^\\+971[2-9]\\d{7,8}$' },
  '966': { name: 'Saudi Arabia', flag: '🇸🇦', pattern: '^\\+966[5]\\d{8}$' },
  '977': { name: 'Nepal', flag: '🇳🇵', pattern: '^\\+977[9]\\d{9}$' },
}

// General international phone number pattern (E.164-like)
const generalPattern = /^\+[1-9]\d{6,14}$/

function getCountryCode(phone: string): string | null {
  const sortedCodes = Object.keys(countryCodeMap).sort((a, b) => b.length - a.length)
  for (const code of sortedCodes) {
    if (phone.startsWith('+' + code)) {
      return code
    }
  }
  return null
}

function validateNumber(phone: string): ValidationResult {
  const trimmed = phone.replace(/[\s\-()]/g, '').trim()

  // Must start with +
  if (!trimmed.startsWith('+')) {
    return {
      number: phone.trim(),
      valid: false,
      reason: 'Missing international prefix (+)',
    }
  }

  // Check general format first
  if (!generalPattern.test(trimmed)) {
    if (trimmed.length < 8) {
      return {
        number: phone.trim(),
        valid: false,
        reason: 'Number too short for an international format',
      }
    }
    if (trimmed.length > 16) {
      return {
        number: phone.trim(),
        valid: false,
        reason: 'Number too long for an international format',
      }
    }
    return {
      number: phone.trim(),
      valid: false,
      reason: 'Invalid phone number format',
    }
  }

  // Check country-specific pattern
  const countryCode = getCountryCode(trimmed)
  if (countryCode && countryCodeMap[countryCode]) {
    const countryInfo = countryCodeMap[countryCode]
    const countryPattern = new RegExp(countryInfo.pattern)

    if (countryPattern.test(trimmed)) {
      return {
        number: phone.trim(),
        valid: true,
        country: countryInfo.name,
        flag: countryInfo.flag,
      }
    } else {
      return {
        number: phone.trim(),
        valid: false,
        reason: `Invalid ${countryInfo.name} phone number format`,
      }
    }
  }

  // Valid international format but unknown country code specifics
  return {
    number: phone.trim(),
    valid: true,
    country: 'Unknown',
    flag: '🌍',
  }
}

export async function POST(request: Request) {
  try {
    const body: ValidationRequest = await request.json()

    if (!body.numbers || !Array.isArray(body.numbers)) {
      return NextResponse.json(
        { error: 'Please provide an array of phone numbers' },
        { status: 400 }
      )
    }

    if (body.numbers.length === 0) {
      return NextResponse.json(
        { error: 'No phone numbers provided' },
        { status: 400 }
      )
    }

    if (body.numbers.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 numbers per request' },
        { status: 400 }
      )
    }

    const results: ValidationResult[] = body.numbers.map((num) => {
      if (typeof num !== 'string' || !num.trim()) {
        return {
          number: String(num),
          valid: false,
          reason: 'Empty or invalid input',
        }
      }
      return validateNumber(num)
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json(
      { error: 'Failed to validate numbers' },
      { status: 500 }
    )
  }
}
