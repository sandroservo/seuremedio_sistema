/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Layout da Área Administrativa
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não redireciona se estiver na página de login
    if (pathname === '/admin/login') return;

    if (!isLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.role !== 'admin') {
        router.push('/admin/login');
      }
    }
  }, [user, isLoading, router, pathname]);

  // Se estiver na página de login, renderiza normalmente
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não for admin, não renderiza
  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
