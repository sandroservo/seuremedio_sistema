/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Cadastro de novos clientes
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address } = body

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Cria novo usuário como cliente
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        role: 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    })

    // Mapeia role para lowercase
    const mappedUser = {
      ...user,
      role: user.role.toLowerCase() as 'client',
    }

    return NextResponse.json(mappedUser, { status: 201 })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar usuário' },
      { status: 500 }
    )
  }
}
