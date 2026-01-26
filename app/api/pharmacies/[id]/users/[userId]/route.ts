/**
 * API Route - Gerenciar usuário específico de uma farmácia
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;

    const user = await prisma.user.findFirst({
      where: { id: userId, pharmacyId: id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado nesta farmácia' }, { status: 404 });
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
