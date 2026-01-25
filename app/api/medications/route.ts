/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Medicamentos (GET, POST)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/medications - Lista todos os medicamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category }),
    }

    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medication.count({ where }),
    ])

    return NextResponse.json({
      data: medications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar medicamentos' },
      { status: 500 }
    )
  }
}

// POST /api/medications - Cria um novo medicamento (Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, requiresPrescription, stock, image } = body

    if (!name || price === undefined || !category) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, price, category' },
        { status: 400 }
      )
    }

    const medication = await prisma.medication.create({
      data: {
        name,
        description: description || '',
        price,
        category,
        requiresPrescription: requiresPrescription || false,
        stock: stock || 0,
        image: image || null,
      },
    })

    return NextResponse.json(medication, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar medicamento:', error)
    
    // Erro de constraint unique (nome duplicado)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um medicamento com este nome' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar medicamento' },
      { status: 500 }
    )
  }
}
