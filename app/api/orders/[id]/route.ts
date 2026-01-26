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

// Transições de estado permitidas
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Estados que requerem pagamento confirmado (não pode pular direto de PENDING)
const STATES_REQUIRING_PAYMENT = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

// PUT /api/orders/[id] - Atualiza status do pedido
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    // Busca o pedido atual para validações
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true, paymentId: true, paymentMethod: true },
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (status) {
      const currentStatus = currentOrder.status.toUpperCase()
      const newStatus = status.toUpperCase()
      
      // Validação de transição de estado
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || []
      if (!allowedNext.includes(newStatus)) {
        return NextResponse.json(
          { error: `Transição de status inválida: ${currentStatus} → ${newStatus}` },
          { status: 400 }
        )
      }

      // Validação: pedidos com pagamento online precisam de confirmação
      // Pedidos em dinheiro podem ser aprovados sem confirmação prévia
      if (currentStatus === 'PENDING' && STATES_REQUIRING_PAYMENT.includes(newStatus)) {
        const paymentConfirmed = currentOrder.paymentStatus === 'CONFIRMED'
        const isCashPayment = currentOrder.paymentMethod === 'cash'
        
        // Só bloqueia se NÃO for pagamento em dinheiro E pagamento não estiver confirmado
        if (!isCashPayment && !paymentConfirmed) {
          return NextResponse.json(
            { error: 'Não é possível aprovar o pedido. O pagamento ainda não foi confirmado.' },
            { status: 400 }
          )
        }
      }
    }

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
