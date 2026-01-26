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
import { 
  Loader2, Plus, Minus, Trash2, X, ShoppingCart, Menu,
  Pill, Heart, Thermometer, Baby, Leaf, Sparkles, Search, ChevronRight
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerSlides, setBannerSlides] = useState<Array<{
    id: string;
    subtitle: string;
    title: string;
    discount: string;
    image: string | null;
    bgColor: string;
    borderColor: string;
  }>>([]);
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>>([]);
  
  // Drag to scroll para categorias
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Carregar banners da API
  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBannerSlides(data);
        } else {
          // Fallback para banners padrão se não houver nenhum no banco
          setBannerSlides([
            {
              id: 'default-1',
              subtitle: 'Ofertas em Medicamentos',
              title: 'Aproveite a Oferta',
              discount: '20',
              image: '/images/banner-farmacia.png',
              bgColor: 'from-amber-50 to-orange-50',
              borderColor: 'border-amber-200',
            },
            {
              id: 'default-2',
              subtitle: 'Vitaminas e Suplementos',
              title: 'Cuide da sua Saúde',
              discount: '15',
              image: '/images/banner-vitaminas.png',
              bgColor: 'from-green-50 to-emerald-50',
              borderColor: 'border-green-200',
            },
            {
              id: 'default-3',
              subtitle: 'Entrega Rápida',
              title: 'Receba em Casa',
              discount: 'Grátis',
              image: '/images/banner-entrega.png',
              bgColor: 'from-blue-50 to-cyan-50',
              borderColor: 'border-blue-200',
            },
          ]);
        }
      })
      .catch(() => {
        // Fallback em caso de erro
        setBannerSlides([
          {
            id: 'default-1',
            subtitle: 'Ofertas em Medicamentos',
            title: 'Aproveite a Oferta',
            discount: '20',
            image: '/images/banner-farmacia.png',
            bgColor: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
          },
        ]);
      });
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (searchTerm || selectedCategory || bannerSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedCategory, bannerSlides.length]);

  // Carregar categorias da API
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  // Handlers para drag-to-scroll das categorias
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

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

  const filteredMedications = medications.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <span className="text-xs sm:text-sm text-white/80 hidden sm:inline">{user.name}</span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={logout}
                  className="bg-white/10 text-white border border-white/30 hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => router.push('/login')}
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 lg:pb-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
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
              <div className="space-y-5 sm:space-y-6">
                {/* Barra de Busca Melhorada */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar medicamentos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value) setSelectedCategory(null);
                    }}
                    className="w-full pl-10 h-12 text-base rounded-xl border-2 focus:border-primary"
                  />
                </div>

                {/* Banner Slideshow de Ofertas */}
                {!searchTerm && !selectedCategory && (
                  <div className="relative">
                    <div className="overflow-hidden rounded-2xl">
                      <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {bannerSlides.map((slide, index) => (
                          <div 
                            key={index}
                            className={`w-full flex-shrink-0 bg-gradient-to-r ${slide.bgColor} border ${slide.borderColor} rounded-2xl`}
                          >
                            <div className="flex">
                              <div className="flex-1 p-4 sm:p-6">
                                <p className="text-muted-foreground text-xs sm:text-sm mb-1">{slide.subtitle}</p>
                                <h3 className="text-foreground text-lg sm:text-xl font-bold mb-2">
                                  {slide.title}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                  {slide.discount !== 'Grátis' ? (
                                    <>
                                      <span className="text-xs sm:text-sm text-muted-foreground">Até</span>
                                      <span className="text-3xl sm:text-4xl font-bold text-primary">{slide.discount}</span>
                                      <span className="text-lg sm:text-xl font-bold text-primary">%</span>
                                      <span className="text-xs sm:text-sm text-muted-foreground ml-1">OFF</span>
                                    </>
                                  ) : (
                                    <span className="text-3xl sm:text-4xl font-bold text-primary">{slide.discount}</span>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  className="bg-[#2D1B4E] hover:bg-[#3D2B5E] text-white text-xs sm:text-sm rounded-full px-4"
                                  onClick={() => {
                                    const productsSection = document.getElementById('products-section');
                                    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                >
                                  Ver Agora
                                </Button>
                              </div>
                              {slide.image && (
                                <div className="w-32 sm:w-48 relative">
                                  <img 
                                    src={slide.image} 
                                    alt={slide.title}
                                    className="absolute inset-0 w-full h-full object-cover object-center rounded-l-2xl"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Indicadores do Slideshow */}
                    <div className="flex justify-center gap-2 mt-3">
                      {bannerSlides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`h-2 rounded-full transition-all ${
                            currentSlide === index 
                              ? 'w-6 bg-primary' 
                              : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Categorias */}
                {!searchTerm && categories.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-base sm:text-lg">Categorias</h3>
                      <button 
                        className="text-xs sm:text-sm text-primary flex items-center gap-1 hover:underline"
                        onClick={() => setSelectedCategory(null)}
                      >
                        Ver todas <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div 
                      ref={categoriesRef}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      className={`flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    >
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.name;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => !isDragging && setSelectedCategory(isSelected ? null : cat.name)}
                            className={`flex-shrink-0 flex flex-col items-center p-3 sm:p-4 rounded-xl transition active:scale-95 min-w-[80px] sm:min-w-[100px] ${
                              isSelected 
                                ? 'bg-primary/10 ring-2 ring-primary' 
                                : 'bg-card hover:bg-muted border'
                            }`}
                          >
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${cat.color || 'bg-gray-100'} flex items-center justify-center mb-2`}>
                              <span className="text-xl sm:text-2xl">{cat.icon || '💊'}</span>
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-2">
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Título da Seção de Produtos */}
                <div id="products-section" className="flex items-center justify-between">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {selectedCategory || 'Todos os Produtos'}
                  </h3>
                  <span className="text-xs sm:text-sm text-muted-foreground">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {filteredMedications.map((med) => (
                        <Card key={med.id} className="hover:shadow-lg transition overflow-hidden active:scale-[0.99]">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex gap-3 sm:gap-4">
                              <MedicationImage 
                                category={med.category} 
                                name={med.name} 
                                image={med.image}
                                size="lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                                  {med.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-1 sm:mb-2">{med.category}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1 sm:mb-2 hidden sm:block">
                                  {med.description}
                                </p>
                                {med.requiresPrescription && (
                                  <span className="inline-block text-[10px] bg-amber-100 text-amber-700 rounded px-2 py-0.5">
                                    Requer receita
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t gap-2">
                              <div className="min-w-0">
                                <span className="text-lg sm:text-xl font-bold text-primary">
                                  R${med.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">
                                  {med.stock} em estoque
                                </span>
                              </div>
                              <Button
                                onClick={() => handleAddToCart(med.id)}
                                disabled={med.stock === 0}
                                size="sm"
                                className="shrink-0 min-h-[44px] sm:h-9 px-3 sm:px-3 text-sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                <span className="sm:inline">Adicionar</span>
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
            <div className="w-80 hidden lg:block">
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

      {/* Botão flutuante do carrinho - Mobile */}
      {activeTab === 'browse' && (
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="h-16 w-16 rounded-full shadow-xl relative"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                    {cartItems.reduce((sum, [, qty]) => sum + qty, 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">Carrinho</SheetTitle>
                  {cartItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCart}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Limpar tudo
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-4rem)]">
                {cartItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para continuar</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                      {cartItems.map(([medId, qty]) => {
                        const med = medications.find((m) => m.id === medId);
                        return (
                          <div key={medId} className="bg-muted/50 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                              <p className="font-semibold text-base leading-tight flex-1 pr-2">{med?.name}</p>
                              <button
                                onClick={() => handleDeleteFromCart(medId)}
                                className="text-muted-foreground hover:text-destructive transition p-1"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleRemoveFromCart(medId)}
                                  className="h-11 w-11 rounded-full bg-background border-2 flex items-center justify-center hover:bg-muted transition active:scale-95"
                                >
                                  <Minus className="h-5 w-5" />
                                </button>
                                <span className="w-10 text-center font-bold text-lg">{qty}</span>
                                <button
                                  onClick={() => handleAddToCart(medId)}
                                  className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition active:scale-95"
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              </div>
                              <p className="font-bold text-primary text-lg">
                                R${((med?.price || 0) * qty).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4 space-y-4 bg-background">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">R${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button 
                        onClick={() => {
                          setMobileCartOpen(false);
                          handleCheckout();
                        }} 
                        className="w-full h-14 text-lg"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Finalizar Compra
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

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
