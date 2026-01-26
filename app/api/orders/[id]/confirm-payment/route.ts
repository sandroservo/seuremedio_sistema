/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Confirmar pagamento em dinheiro (para entregadores e admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// POST /api/orders/[id]/confirm-payment - Confirma pagamento em dinheiro e finaliza entrega
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Verificar autenticação via token JWT (mais confiável em App Router)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      // Fallback para getServerSession
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }

    const userRole = token?.role as string
    const userId = token?.id as string

    // Apenas ADMIN ou DELIVERY podem confirmar pagamentos em dinheiro
    if (userRole !== 'ADMIN' && userRole !== 'DELIVERY') {
      return NextResponse.json(
        { error: 'Apenas administradores ou entregadores podem confirmar pagamentos' },
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
        status: true,
        deliveryTask: {
          select: {
            id: true,
            deliveryPersonId: true,
            status: true,
          }
        }
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

    // Se for entregador, verificar se é o entregador deste pedido e se o pedido está em entrega
    if (userRole === 'DELIVERY') {
      if (!order.deliveryTask) {
        return NextResponse.json(
          { error: 'Este pedido ainda não foi atribuído para entrega' },
          { status: 400 }
        )
      }
      
      if (order.deliveryTask.deliveryPersonId !== userId) {
        return NextResponse.json(
          { error: 'Você não é o entregador deste pedido' },
          { status: 403 }
        )
      }

      // Entregador só pode confirmar se o pedido está SHIPPED (em entrega)
      if (order.status !== 'SHIPPED') {
        return NextResponse.json(
          { error: 'Só é possível confirmar pagamento de pedidos em entrega' },
          { status: 400 }
        )
      }
    }

    // Admin não pode confirmar pedidos cancelados ou já entregues
    if (userRole === 'ADMIN') {
      if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
        return NextResponse.json(
          { error: 'Não é possível confirmar pagamento de pedidos cancelados ou já entregues' },
          { status: 400 }
        )
      }
    }

    if (order.paymentStatus === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'O pagamento deste pedido já foi confirmado' },
        { status: 400 }
      )
    }

    // Atualiza o pedido: confirma pagamento e finaliza como entregue
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'CONFIRMED',
        status: 'DELIVERED',
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

    // Atualiza a tarefa de entrega para DELIVERED
    if (order.deliveryTask) {
      await prisma.deliveryTask.update({
        where: { id: order.deliveryTask.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      message: 'Pagamento confirmado e entrega finalizada com sucesso',
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
