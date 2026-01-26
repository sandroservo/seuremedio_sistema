/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Confirmar pagamento em dinheiro
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// POST /api/orders/[id]/confirm-payment - Confirma pagamento em dinheiro
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Verificar autenticação e permissão de admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem confirmar pagamentos' },
        { status: 403 }
      )
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { 
        id: true, 
        paymentMethod: true, 
        paymentStatus: true,
        status: true 
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.paymentMethod !== 'cash') {
      return NextResponse.json(
        { error: 'Este endpoint é apenas para pedidos com pagamento em dinheiro' },
        { status: 400 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Só é possível confirmar pagamento de pedidos pendentes' },
        { status: 400 }
      )
    }

    if (order.paymentStatus === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'O pagamento deste pedido já foi confirmado' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'CONFIRMED',
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

    return NextResponse.json({
      message: 'Pagamento em dinheiro confirmado com sucesso',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao confirmar pagamento' },
      { status: 500 }
    )
  }
}
