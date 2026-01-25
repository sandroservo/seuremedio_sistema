/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API de Status de Pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/asaas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const payment = await getPaymentStatus(id);

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamento' },
      { status: 500 }
    );
  }
}
