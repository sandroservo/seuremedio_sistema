/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Webhook do Asaas - Recebe notificações de pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AsaasWebhookPayment {
  id: string;
  status: string;
  value: number;
  description?: string;
}

interface AsaasWebhookEvent {
  event: string;
  payment?: AsaasWebhookPayment;
}

export async function POST(request: NextRequest) {
  try {
    const body: AsaasWebhookEvent = await request.json();
    
    console.log('[Asaas Webhook]', body.event, body.payment?.id);

    // Eventos de pagamento
    if (body.payment) {
      const paymentId = body.payment.id;
      const status = body.payment.status;

      // Busca pedido pelo ID do pagamento nas notas
      const order = await prisma.order.findFirst({
        where: {
          notes: {
            contains: paymentId,
          },
        },
      });

      if (order) {
        // Mapeia status do Asaas para status do pedido
        let newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null = null;

        switch (status) {
          case 'CONFIRMED':
          case 'RECEIVED':
          case 'RECEIVED_IN_CASH':
            newStatus = 'CONFIRMED';
            break;
          case 'OVERDUE':
          case 'REFUNDED':
          case 'REFUND_REQUESTED':
          case 'CHARGEBACK_REQUESTED':
          case 'CHARGEBACK_DISPUTE':
          case 'AWAITING_CHARGEBACK_REVERSAL':
          case 'DUNNING_REQUESTED':
          case 'DUNNING_RECEIVED':
            newStatus = 'CANCELLED';
            break;
          case 'PENDING':
          case 'AWAITING_RISK_ANALYSIS':
            newStatus = 'PENDING';
            break;
        }

        if (newStatus && order.status !== newStatus) {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              status: newStatus,
              notes: `${order.notes || ''}\n[${new Date().toISOString()}] Status: ${status}`,
            },
          });
          console.log(`[Asaas Webhook] Pedido ${order.id} atualizado para ${newStatus}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Asaas Webhook] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

// GET para verificação do webhook pelo Asaas
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook Asaas ativo' });
}
