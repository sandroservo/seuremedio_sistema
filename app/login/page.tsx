'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      // Busca usuário real do banco
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Email ou senha inválidos');
        return;
      }

      const user = await res.json();
      login(user);
      router.push('/client/dashboard');
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D1B4E] via-[#3D2B5E] to-[#2D1B4E] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-center text-2xl">Área do Cliente</CardTitle>
          <CardDescription className="text-center">
            Faça login para comprar seus medicamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-primary hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground mb-3">
              Acesso restrito
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/admin/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Admin
                </Button>
              </Link>
              <Link href="/delivery/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Entregador
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
