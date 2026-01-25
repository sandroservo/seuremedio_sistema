/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Entrega individual (GET, PUT)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET /api/deliveries/[id] - Busca uma entrega específica
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const delivery = await prisma.deliveryTask.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            client: {
              select: { id: true, name: true, phone: true, address: true },
            },
            items: {
              include: { medication: true },
            },
          },
        },
        deliveryPerson: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: 'Entrega não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Erro ao buscar entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar entrega' },
      { status: 500 }
    )
  }
}

// PUT /api/deliveries/[id] - Atualiza status da entrega
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, currentLatitude, currentLongitude } = body

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (currentLatitude !== undefined) updateData.currentLatitude = currentLatitude
    if (currentLongitude !== undefined) updateData.currentLongitude = currentLongitude

    // Se status for DELIVERED, registra a data
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.deliveryTask.update({
        where: { id },
        data: updateData,
        include: { order: true },
      })

      // Se entrega concluída, atualiza o pedido
      if (status === 'DELIVERED') {
        await tx.order.update({
          where: { id: updatedDelivery.orderId },
          data: { status: 'DELIVERED' },
        })
      }

      return updatedDelivery
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar entrega' },
      { status: 500 }
    )
  }
}
