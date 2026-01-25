/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Pedido individual (GET, PUT)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET /api/orders/[id] - Busca um pedido específico
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        items: {
          include: {
            medication: true,
          },
        },
        deliveryTask: {
          include: {
            deliveryPerson: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Atualiza status do pedido
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { medication: true },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}
