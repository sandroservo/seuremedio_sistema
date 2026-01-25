/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * API para verificar se pagamento está configurado
 */

import { NextResponse } from 'next/server';
import { isAsaasConfigured } from '@/lib/asaas';

export async function GET() {
  try {
    const configured = await isAsaasConfigured();
    return NextResponse.json({ configured });
  } catch {
    return NextResponse.json({ configured: false });
  }
}
