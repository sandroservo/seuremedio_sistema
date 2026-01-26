/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API Route - Autenticação de login
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Busca usuário pelo email incluindo a senha para verificação
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        password: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Remove a senha do retorno e mapeia role para lowercase
    const { password: _, ...userWithoutPassword } = user
    const mappedUser = {
      ...userWithoutPassword,
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
