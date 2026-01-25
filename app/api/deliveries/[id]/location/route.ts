/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Atualização de localização do entregador
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// PUT /api/deliveries/[id]/location - Atualiza localização do entregador
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { latitude, longitude } = body

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'Latitude e longitude são obrigatórios' },
        { status: 400 }
      )
    }

    const delivery = await prisma.deliveryTask.update({
      where: { id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        updatedAt: new Date(),
      },
      include: {
        order: {
          include: {
            client: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Erro ao atualizar localização:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar localização' },
      { status: 500 }
    )
  }
}

// GET /api/deliveries/[id]/location - Busca localização atual
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const delivery = await prisma.deliveryTask.findUnique({
      where: { id },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        customerLatitude: true,
        customerLongitude: true,
        customerAddress: true,
        status: true,
        deliveryPerson: {
          select: { name: true, phone: true },
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
    console.error('Erro ao buscar localização:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar localização' },
      { status: 500 }
    )
  }
}
