/**
 * API Route - Lista cidades por estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCitiesByState } from '@/lib/brazil-locations'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const uf = searchParams.get('uf')

  if (!uf) {
    return NextResponse.json(
      { error: 'Parâmetro uf é obrigatório' },
      { status: 400 }
    )
  }

  const cities = getCitiesByState(uf)
  return NextResponse.json(cities)
}
