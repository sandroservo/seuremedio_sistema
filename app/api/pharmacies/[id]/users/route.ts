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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pharmacyId: id },
    });

    return NextResponse.json(user);
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
