/**
 * API Route - Usuários de uma farmácia
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: {
        pharmacyId: id,
        ...(role && { role: role as 'ADMIN' | 'DELIVERY' }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, name, email, password, role, phone } = body;

    if (userId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { pharmacyId: id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
        },
      });
      return NextResponse.json(user);
    }

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Nome, email, senha e função são obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role as 'ADMIN' | 'DELIVERY',
        phone: phone || null,
        pharmacyId: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Erro ao adicionar usuário à farmácia:', error);
    return NextResponse.json({ error: 'Erro ao adicionar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pharmacyId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover usuário da farmácia:', error);
    return NextResponse.json({ error: 'Erro ao remover usuário' }, { status: 500 });
  }
}
