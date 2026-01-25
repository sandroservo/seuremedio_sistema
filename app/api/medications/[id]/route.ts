/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Medicamento individual (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET /api/medications/[id] - Busca um medicamento específico
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const medication = await prisma.medication.findUnique({
      where: { id },
    })

    if (!medication) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(medication)
  } catch (error) {
    console.error('Erro ao buscar medicamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar medicamento' },
      { status: 500 }
    )
  }
}

// PUT /api/medications/[id] - Atualiza um medicamento (Admin)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const medication = await prisma.medication.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(medication)
  } catch (error) {
    console.error('Erro ao atualizar medicamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar medicamento' },
      { status: 500 }
    )
  }
}

// DELETE /api/medications/[id] - Remove um medicamento (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    await prisma.medication.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ message: 'Medicamento removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover medicamento:', error)
    return NextResponse.json(
      { error: 'Erro ao remover medicamento' },
      { status: 500 }
    )
  }
}
