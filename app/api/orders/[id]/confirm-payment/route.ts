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
    // Obter dados do corpo da requisição
    let body: { deliveryPersonId?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Corpo vazio é permitido para admin
    }

    // Tentar autenticação via token JWT
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    let userRole: string | undefined
    let userId: string | undefined

    if (token) {
      userRole = token.role as string
      userId = token.id as string
    } else {
      // Fallback para getServerSession
      const session = await getServerSession(authOptions)
      if (session?.user) {
        userRole = session.user.role
        userId = session.user.id
      }
    }

    // Se não conseguiu autenticar via sessão, usar deliveryPersonId do body
    if (!userRole && body.deliveryPersonId) {
      // Validar que o deliveryPersonId existe e é um entregador
      const deliveryPerson = await prisma.user.findUnique({
        where: { id: body.deliveryPersonId },
        select: { id: true, role: true }
      })
      
      if (deliveryPerson && deliveryPerson.role === 'DELIVERY') {
        userRole = 'DELIVERY'
        userId = deliveryPerson.id
      }
    }

    if (!userRole || !userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

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
