/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Autenticação de login
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Nota: Em produção, verificar hash da senha
    // Por enquanto, aceita qualquer senha para demo

    // Mapeia role para lowercase para compatibilidade
    const mappedUser = {
      ...user,
      role: user.role.toLowerCase() as 'admin' | 'client' | 'delivery',
    }

    return NextResponse.json(mappedUser)
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
