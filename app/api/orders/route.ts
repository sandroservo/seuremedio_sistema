/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Pedidos (GET, POST)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/orders - Lista pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            include: {
              medication: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          deliveryTask: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    const response = NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
    
    // Desabilitar cache para sempre ter dados atualizados
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Cria um novo pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, items, shippingAddress, notes } = body

    if (!clientId || !items || items.length === 0 || !shippingAddress) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: clientId, items, shippingAddress' },
        { status: 400 }
      )
    }

    // Busca os medicamentos para calcular o preço
    const medicationIds = items.map((item: any) => item.medicationId)
    const medications = await prisma.medication.findMany({
      where: { id: { in: medicationIds } },
    })

    // Valida estoque e calcula total
    let totalPrice = 0
    const orderItems = items.map((item: any) => {
      const medication = medications.find((m) => m.id === item.medicationId)
      if (!medication) {
        throw new Error(`Medicamento ${item.medicationId} não encontrado`)
      }
      if (medication.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${medication.name}`)
      }
      const itemPrice = Number(medication.price) * item.quantity
      totalPrice += itemPrice
      return {
        medicationId: item.medicationId,
        quantity: item.quantity,
        price: medication.price,
      }
    })

    // Cria o pedido em uma transação
    const order = await prisma.$transaction(async (tx) => {
      // Atualiza estoque
      for (const item of items) {
        await tx.medication.update({
          where: { id: item.medicationId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Cria o pedido
      return tx.order.create({
        data: {
          clientId,
          totalPrice,
          shippingAddress,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { medication: true },
          },
        },
      })
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
