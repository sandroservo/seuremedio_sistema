/**
 * API Route - Lista estados brasileiros
 */

import { NextResponse } from 'next/server'
import { states } from '@/lib/brazil-locations'

export async function GET() {
  return NextResponse.json(states)
}
