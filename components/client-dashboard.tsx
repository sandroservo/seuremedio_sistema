'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMedications } from '@/hooks/use-medications';
import { useOrders } from '@/hooks/use-orders';
import { OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Logo } from '@/components/logo';
import { Loader2, Plus, Minus, Trash2, X, ShoppingCart } from 'lucide-react';
import { MedicationImage } from '@/components/medication-image';

const CART_STORAGE_KEY = 'seuremedio_cart';

export function ClientDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { 
    medications, 
    isLoading: loadingMeds, 
    isLoadingMore,
    hasMore,
    loadMore 
  } = useMedications();
  const { orders, isLoading: loadingOrders, addOrder, refetch: refetchOrders } = useOrders(user?.id);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'orders'>('browse');
  const [checkoutFeedback, setCheckoutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Carregar carrinho do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {}
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);
  
  // Ref para o observador de scroll infinito
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMeds || isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !searchTerm) {
        loadMore();
      }
    }, { rootMargin: '100px' });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMeds, isLoadingMore, hasMore, loadMore, searchTerm]);

  const filteredMedications = medications.filter(
    (m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (medicationId: string) => {
    setCart((prev) => ({
      ...prev,
      [medicationId]: (prev[medicationId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (medicationId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[medicationId] > 1) {
        newCart[medicationId] -= 1;
      } else {
        delete newCart[medicationId];
      }
      return newCart;
    });
  };

  const handleDeleteFromCart = (medicationId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[medicationId];
      return newCart;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Se não estiver logado, redireciona para login
    if (!user?.id) {
      router.push('/login');
      return;
    }
    
    router.push('/client/checkout');
  };

  const cartItems = Object.entries(cart);
  const cartTotal = cartItems.reduce((sum, [medId, qty]) => {
    const med = medications.find((m) => m.id === medId);
    return sum + (med?.price || 0) * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#2D1B4E] sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-white/80">{user.name}</span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={logout}
                  className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => router.push('/login')}
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'browse'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Catálogo
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'orders'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Meus Pedidos
                </button>
              )}
            </div>

            {activeTab === 'browse' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Buscar medicamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                  <span className="text-sm text-muted-foreground">
                    {filteredMedications.length} produtos
                  </span>
                </div>

                {loadingMeds ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredMedications.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Nenhum medicamento encontrado
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMedications.map((med) => (
                        <Card key={med.id} className="hover:shadow-lg transition overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <MedicationImage 
                                category={med.category} 
                                name={med.name} 
                                image={med.image}
                                size="lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base leading-tight mb-1 truncate">
                                  {med.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-2">{med.category}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {med.description}
                                </p>
                                {med.requiresPrescription && (
                                  <span className="inline-block text-[10px] bg-amber-100 text-amber-700 rounded px-2 py-0.5 mb-2">
                                    Requer receita
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div>
                                <span className="text-xl font-bold text-primary">
                                  R${med.price.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {med.stock} em estoque
                                </span>
                              </div>
                              <Button
                                onClick={() => handleAddToCart(med.id)}
                                disabled={med.stock === 0}
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Trigger para scroll infinito */}
                    {!searchTerm && hasMore && (
                      <div ref={loadMoreRef} className="flex justify-center py-8">
                        {isLoadingMore && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Carregando mais...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!searchTerm && !hasMore && medications.length > 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Todos os {medications.length} medicamentos carregados
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Nenhum pedido realizado ainda
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => {
                    const status = order.status.toLowerCase();
                    const statusColors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      confirmed: 'bg-blue-100 text-blue-800',
                      processing: 'bg-purple-100 text-purple-800',
                      shipped: 'bg-orange-100 text-orange-800',
                      delivered: 'bg-green-100 text-green-800',
                      cancelled: 'bg-red-100 text-red-800',
                    };
                    const statusLabels: Record<string, string> = {
                      pending: 'Pendente',
                      confirmed: 'Confirmado',
                      processing: 'Em Preparação',
                      shipped: 'Em Trânsito',
                      delivered: 'Entregue',
                      cancelled: 'Cancelado',
                    };
                    return (
                    <Card key={order.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Pedido #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status] || 'bg-gray-100'}`}>
                            {statusLabels[status] || status}
                          </span>
                        </div>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p>Endereço: {order.shippingAddress}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary">
                            Total: R${Number(order.totalPrice).toFixed(2)}
                          </div>
                          {status === 'shipped' && order.deliveryTask?.id && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/client/rastreamento/${order.deliveryTask?.id}`)}
                            >
                              🗺️ Rastrear
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {activeTab === 'browse' && (
            <div className="w-80">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Carrinho</CardTitle>
                    {cartItems.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCart}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Carrinho vazio
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {cartItems.map(([medId, qty]) => {
                          const med = medications.find((m) => m.id === medId);
                          return (
                            <div key={medId} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-medium text-sm leading-tight">{med?.name}</p>
                                <button
                                  onClick={() => handleDeleteFromCart(medId)}
                                  className="text-muted-foreground hover:text-destructive transition"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRemoveFromCart(medId)}
                                    className="h-7 w-7 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-8 text-center font-medium">{qty}</span>
                                  <button
                                    onClick={() => handleAddToCart(medId)}
                                    className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="font-bold text-primary">
                                  R${((med?.price || 0) * qty).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">R${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button 
                          onClick={handleCheckout} 
                          className="w-full"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Finalizar Compra
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <AlertDialog open={!!checkoutFeedback} onOpenChange={(open) => !open && setCheckoutFeedback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {checkoutFeedback?.type === 'success' ? 'Pedido confirmado' : 'Ops! Ocorreu um erro'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {checkoutFeedback?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full" onClick={() => setCheckoutFeedback(null)}>
              Ok
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
