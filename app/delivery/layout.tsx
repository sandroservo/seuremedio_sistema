/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Layout da Área do Entregador
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não redireciona se estiver na página de login
    if (pathname === '/delivery/login') return;

    if (!isLoading) {
      if (!user) {
        router.push('/delivery/login');
      } else if (user.role !== 'delivery') {
        router.push('/delivery/login');
      }
    }
  }, [user, isLoading, router, pathname]);

  // Se estiver na página de login, renderiza normalmente
  if (pathname === '/delivery/login') {
    return <>{children}</>;
  }

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-emerald-300">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não for entregador, não renderiza
  if (!user || user.role !== 'delivery') {
    return null;
  }

  return <>{children}</>;
}
