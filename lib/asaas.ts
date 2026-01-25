/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Serviço de integração com Asaas
 */

import { prisma } from '@/lib/prisma';

interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  netValue: number;
  billingType: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
}

// Busca configurações do Asaas no banco
export async function getAsaasConfig(): Promise<AsaasConfig | null> {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['asaas_api_key', 'asaas_environment'],
        },
      },
    });

    const apiKey = settings.find((s: { key: string; value: string }) => s.key === 'asaas_api_key')?.value;
    const environment = settings.find((s: { key: string; value: string }) => s.key === 'asaas_environment')?.value as 'sandbox' | 'production';

    if (!apiKey) return null;

    return {
      apiKey,
      environment: environment || 'sandbox',
    };
  } catch {
    return null;
  }
}

// URL base da API do Asaas
function getBaseUrl(environment: 'sandbox' | 'production'): string {
  return environment === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

// Criar ou buscar cliente no Asaas
export async function createOrGetCustomer(customer: AsaasCustomer): Promise<AsaasCustomer | null> {
  const config = await getAsaasConfig();
  if (!config) throw new Error('Asaas não configurado');

  const baseUrl = getBaseUrl(config.environment);

  // Busca cliente existente por CPF/CNPJ
  const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${customer.cpfCnpj}`, {
    headers: {
      'access_token': config.apiKey,
    },
  });

  if (searchResponse.ok) {
    const data = await searchResponse.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
  }

  // Cria novo cliente
  const createResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.apiKey,
    },
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj,
      phone: customer.phone,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
  }

  return createResponse.json();
}

// Criar cobrança PIX
export async function createPixPayment(
  customerId: string,
  value: number,
  description: string
): Promise<AsaasPayment> {
  const config = await getAsaasConfig();
  if (!config) throw new Error('Asaas não configurado');

  const baseUrl = getBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.apiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value,
      description,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 dia
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar cobrança PIX');
  }

  const payment = await response.json();

  // Busca QR Code do PIX
  const qrResponse = await fetch(`${baseUrl}/payments/${payment.id}/pixQrCode`, {
    headers: {
      'access_token': config.apiKey,
    },
  });

  if (qrResponse.ok) {
    const qrData = await qrResponse.json();
    payment.pixQrCodeUrl = qrData.encodedImage;
    payment.pixCopiaECola = qrData.payload;
  }

  return payment;
}

// Criar cobrança Boleto
export async function createBoletoPayment(
  customerId: string,
  value: number,
  description: string
): Promise<AsaasPayment> {
  const config = await getAsaasConfig();
  if (!config) throw new Error('Asaas não configurado');

  const baseUrl = getBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.apiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'BOLETO',
      value,
      description,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 dias
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar boleto');
  }

  return response.json();
}

// Criar cobrança Cartão de Crédito
export async function createCreditCardPayment(
  customerId: string,
  value: number,
  description: string,
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  },
  holder: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
  }
): Promise<AsaasPayment> {
  const config = await getAsaasConfig();
  if (!config) throw new Error('Asaas não configurado');

  const baseUrl = getBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.apiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value,
      description,
      dueDate: new Date().toISOString().split('T')[0],
      creditCard: {
        holderName: card.holderName,
        number: card.number,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        ccv: card.ccv,
      },
      creditCardHolderInfo: {
        name: holder.name,
        email: holder.email,
        cpfCnpj: holder.cpfCnpj,
        phone: holder.phone,
        postalCode: holder.postalCode,
        addressNumber: holder.addressNumber,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.description || 'Erro ao processar cartão');
  }

  return response.json();
}

// Consultar status do pagamento
export async function getPaymentStatus(paymentId: string): Promise<AsaasPayment | null> {
  const config = await getAsaasConfig();
  if (!config) throw new Error('Asaas não configurado');

  const baseUrl = getBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
    headers: {
      'access_token': config.apiKey,
    },
  });

  if (!response.ok) return null;

  return response.json();
}

// Verificar se Asaas está configurado
export async function isAsaasConfigured(): Promise<boolean> {
  const config = await getAsaasConfig();
  return config !== null && config.apiKey.length > 0;
}
