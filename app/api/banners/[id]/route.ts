import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const banner = await prisma.banner.findUnique({
      where: { id }
    })
    if (!banner) {
      return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 })
    }
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Erro ao buscar banner:', error)
    return NextResponse.json({ error: 'Erro ao buscar banner' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        discount: data.discount,
        bgColor: data.bgColor,
        borderColor: data.borderColor,
        image: data.image,
        action: data.action,
        active: data.active,
        order: data.order
      }
    })
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Erro ao atualizar banner:', error)
    return NextResponse.json({ error: 'Erro ao atualizar banner' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.banner.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir banner:', error)
    return NextResponse.json({ error: 'Erro ao excluir banner' }, { status: 500 })
  }
}
