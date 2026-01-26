import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('all') === 'true'
    
    const banners = await prisma.banner.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Erro ao buscar banners:', error)
    return NextResponse.json({ error: 'Erro ao buscar banners' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        discount: data.discount,
        bgColor: data.bgColor || 'from-amber-50 to-orange-50',
        borderColor: data.borderColor || 'border-amber-100',
        image: data.image,
        action: data.action,
        active: data.active ?? true,
        order: data.order ?? 0
      }
    })
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Erro ao criar banner:', error)
    return NextResponse.json({ error: 'Erro ao criar banner' }, { status: 500 })
  }
}
