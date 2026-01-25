/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API de Configurações do Sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Buscar todas as configurações
export async function GET() {
  try {
    const settings = await prisma.settings.findMany();
    
    // Converte para objeto chave-valor
    const settingsObj: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// POST - Salvar configurações
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Atualiza ou cria cada configuração
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
