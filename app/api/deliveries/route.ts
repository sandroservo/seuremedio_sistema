/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Entregas (GET, POST)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/deliveries - Lista entregas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deliveryPersonId = searchParams.get('deliveryPersonId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      ...(deliveryPersonId && { deliveryPersonId }),
      ...(status && { status: status as 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'FAILED' }),
    }

    const [deliveries, total] = await Promise.all([
      prisma.deliveryTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              client: {
                select: { id: true, name: true, phone: true },
              },
              items: {
                include: {
                  medication: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          deliveryPerson: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.deliveryTask.count({ where }),
    ])

    return NextResponse.json({
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar entregas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar entregas' },
      { status: 500 }
    )
  }
}

// POST /api/deliveries - Cria tarefa de entrega ou atribui entregador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, deliveryPersonId, estimatedDeliveryTime } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Campo obrigatório: orderId' },
        { status: 400 }
      )
    }

    // Verifica se o pedido existe e busca o endereço
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, shippingAddress: true, status: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Se não tem deliveryPersonId, apenas marca como disponível para entrega
    if (!deliveryPersonId) {
      // Verifica se já existe uma tarefa de entrega
      const existingTask = await prisma.deliveryTask.findUnique({
        where: { orderId },
      })

      if (existingTask) {
        return NextResponse.json(
          { error: 'Pedido já tem tarefa de entrega' },
          { status: 400 }
        )
      }

      // Retorna sucesso - o pedido está liberado (status SHIPPED já foi atualizado)
      return NextResponse.json({ message: 'Pedido liberado para entrega' }, { status: 200 })
    }

    // Com deliveryPersonId, cria/atualiza a tarefa de entrega
    const delivery = await prisma.$transaction(async (tx) => {
      // Verifica se já existe tarefa
      const existingTask = await tx.deliveryTask.findUnique({
        where: { orderId },
      })

      if (existingTask) {
        // Atualiza tarefa existente com entregador
        return tx.deliveryTask.update({
          where: { orderId },
          data: {
            deliveryPersonId,
            status: 'IN_PROGRESS',
            estimatedDeliveryTime: estimatedDeliveryTime
              ? new Date(estimatedDeliveryTime)
              : new Date(Date.now() + 60 * 60 * 1000), // 1 hora
          },
          include: {
            order: true,
            deliveryPerson: {
              select: { id: true, name: true, phone: true },
            },
          },
        })
      }

      // Cria nova tarefa de entrega
      return tx.deliveryTask.create({
        data: {
          orderId,
          deliveryPersonId,
          customerAddress: order.shippingAddress,
          status: 'IN_PROGRESS',
          estimatedDeliveryTime: estimatedDeliveryTime
            ? new Date(estimatedDeliveryTime)
            : new Date(Date.now() + 60 * 60 * 1000),
        },
        include: {
          order: true,
          deliveryPerson: {
            select: { id: true, name: true, phone: true },
          },
        },
      })
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao criar entrega' },
      { status: 500 }
    )
  }
}
