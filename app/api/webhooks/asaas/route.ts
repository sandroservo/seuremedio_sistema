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
  customer?: string;
  billingType?: string;
}

interface AsaasWebhookEvent {
  event: string;
  payment?: AsaasWebhookPayment;
}

export async function POST(request: NextRequest) {
  try {
    const body: AsaasWebhookEvent = await request.json();
    
    console.log('[Asaas Webhook] Evento recebido:', body.event, body.payment?.id, body.payment?.status);

    if (!body.payment) {
      return NextResponse.json({ received: true, message: 'Evento sem pagamento' });
    }

    const paymentId = body.payment.id;
    const asaasStatus = body.payment.status;

    // Busca pedido pelo paymentId
    const order = await prisma.order.findFirst({
      where: { paymentId },
    });

    if (!order) {
      console.log(`[Asaas Webhook] Pedido não encontrado para pagamento ${paymentId}`);
      return NextResponse.json({ received: true, message: 'Pedido não encontrado' });
    }

    // Mapeia status do Asaas para PaymentStatus e OrderStatus
    let newPaymentStatus: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED' = 'PENDING';
    let newOrderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null = null;

    switch (asaasStatus) {
      case 'CONFIRMED':
      case 'RECEIVED':
      case 'RECEIVED_IN_CASH':
        newPaymentStatus = 'CONFIRMED';
        newOrderStatus = 'CONFIRMED';
        break;
        
      case 'OVERDUE':
        newPaymentStatus = 'OVERDUE';
        break;
        
      case 'REFUNDED':
      case 'REFUND_REQUESTED':
        newPaymentStatus = 'REFUNDED';
        newOrderStatus = 'CANCELLED';
        break;
        
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
      case 'AWAITING_CHARGEBACK_REVERSAL':
      case 'DUNNING_REQUESTED':
      case 'DUNNING_RECEIVED':
        newPaymentStatus = 'CANCELLED';
        newOrderStatus = 'CANCELLED';
        break;
        
      case 'PENDING':
      case 'AWAITING_RISK_ANALYSIS':
        newPaymentStatus = 'PENDING';
        break;
    }

    // Atualiza o pedido
    const updateData: {
      paymentStatus: typeof newPaymentStatus;
      status?: typeof newOrderStatus;
      notes: string;
    } = {
      paymentStatus: newPaymentStatus,
      notes: `${order.notes || ''}\n[${new Date().toISOString()}] Webhook: ${asaasStatus}`.trim(),
    };

    if (newOrderStatus && order.status !== newOrderStatus) {
      updateData.status = newOrderStatus;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    console.log(`[Asaas Webhook] Pedido ${order.id} atualizado - PaymentStatus: ${newPaymentStatus}, OrderStatus: ${newOrderStatus || 'mantido'}`);

    return NextResponse.json({ 
      received: true, 
      orderId: order.id,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
    });
  } catch (error) {
    console.error('[Asaas Webhook] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

// GET para verificação do webhook pelo Asaas
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook Asaas ativo',
    timestamp: new Date().toISOString(),
  });
}
