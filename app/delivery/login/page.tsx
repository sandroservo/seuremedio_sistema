/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Página de Login - Área do Entregador
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Truck } from 'lucide-react';
import Link from 'next/link';

export default function DeliveryLoginPage() {
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
      
      if (user.role !== 'delivery') {
        setError('Este login é exclusivo para entregadores');
        setIsLoading(false);
        return;
      }

      login(user);
      router.push('/delivery/dashboard');
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-emerald-700 bg-emerald-800/50 backdrop-blur">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-emerald-700/50">
              <Truck className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-white">
            Área do Entregador
          </CardTitle>
          <CardDescription className="text-center text-emerald-300">
            Gerencie suas entregas
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
              <label htmlFor="email" className="text-sm font-medium text-emerald-200">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="entregador@seuremedio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-emerald-700/50 border-emerald-600 text-white placeholder:text-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-emerald-200">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-emerald-700/50 border-emerald-600 text-white placeholder:text-emerald-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Iniciar Entregas'}
            </Button>

            <p className="text-xs text-center text-emerald-400">
              Demo: entregador@seuremedio.com / 123456
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-emerald-700">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="w-full text-emerald-300 hover:text-white">
                ← Voltar ao login principal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
