/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Página de Login - Área Administrativa
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Credenciais inválidas');
        setIsLoading(false);
        return;
      }

      const user = await res.json();
      
      if (user.role !== 'ADMIN') {
        setError('Este login é exclusivo para administradores');
        setIsLoading(false);
        return;
      }

      login(user);
      router.push('/admin/dashboard');
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-slate-700/50">
              <Shield className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-white">
            Painel Administrativo
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Acesso restrito a administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@seuremedio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Acessar Painel'}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Demo: admin@seuremedio.com / 123456
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white">
                ← Voltar ao login principal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
