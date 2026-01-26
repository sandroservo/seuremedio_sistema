/**
 * API Route - Farmácia individual
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            medications: true,
            orders: true,
          },
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Farmácia não encontrada' }, { status: 404 });
    }

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error('Erro ao buscar farmácia:', error);
    return NextResponse.json({ error: 'Erro ao buscar farmácia' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, logo, address, phone, email, active } = body;

    const pharmacy = await prisma.pharmacy.update({
      where: { id },
      data: {
        name,
        description,
        logo,
        address,
        phone,
        email,
        active,
      },
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error('Erro ao atualizar farmácia:', error);
    return NextResponse.json({ error: 'Erro ao atualizar farmácia' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.pharmacy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir farmácia:', error);
    return NextResponse.json({ error: 'Erro ao excluir farmácia' }, { status: 500 });
  }
}
