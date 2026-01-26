/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API de Pagamentos com Asaas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createOrGetCustomer,
  createPixPayment,
  createBoletoPayment,
  isAsaasConfigured,
} from '@/lib/asaas';

export async function POST(request: NextRequest) {
  try {
    // Verifica se Asaas está configurado
    const configured = await isAsaasConfigured();
    if (!configured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderId, paymentMethod, customer } = body;

    if (!orderId || !paymentMethod || !customer) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Busca o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { medication: true } } },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Cria ou busca cliente no Asaas
    const asaasCustomer = await createOrGetCustomer({
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
      phone: customer.phone?.replace(/\D/g, ''),
    });

    if (!asaasCustomer?.id) {
      return NextResponse.json(
        { error: 'Erro ao criar cliente no Asaas' },
        { status: 500 }
      );
    }

    const description = `Pedido #${order.id.slice(0, 8).toUpperCase()} - Seu Remédio`;
    const value = Number(order.totalPrice);

    let payment;

    if (paymentMethod === 'pix') {
      payment = await createPixPayment(asaasCustomer.id, value, description);
    } else if (paymentMethod === 'boleto') {
      payment = await createBoletoPayment(asaasCustomer.id, value, description);
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento não suportado' },
        { status: 400 }
      );
    }

    // Atualiza o pedido com o ID do pagamento e método
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: payment.id,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentStatus: 'PENDING',
        notes: `Aguardando pagamento via ${paymentMethod.toUpperCase()}`,
      },
    });

    console.log(`[Payment] Pedido ${orderId} - Pagamento ${payment.id} criado`);

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      billingType: payment.billingType,
      value: payment.value,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      pixQrCodeUrl: payment.pixQrCodeUrl,
      pixCopiaECola: payment.pixCopiaECola,
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
