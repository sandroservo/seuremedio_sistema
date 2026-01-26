/**
 * API Route - Gerenciamento de Farmácias
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const where: { active?: boolean } = {};
    if (active === 'true') {
      where.active = true;
    }

    const pharmacies = await prisma.pharmacy.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            medications: true,
            orders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error('Erro ao buscar farmácias:', error);
    return NextResponse.json({ error: 'Erro ao buscar farmácias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, logo, address, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await prisma.pharmacy.findUnique({
      where: { slug },
    });

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const pharmacy = await prisma.pharmacy.create({
      data: {
        name,
        slug: finalSlug,
        description,
        logo,
        address,
        phone,
        email,
      },
    });

    return NextResponse.json(pharmacy, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar farmácia:', error);
    return NextResponse.json({ error: 'Erro ao criar farmácia' }, { status: 500 });
  }
}
