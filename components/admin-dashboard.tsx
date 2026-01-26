'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMedications } from '@/hooks/use-medications';
import { useOrders } from '@/hooks/use-orders';
import { useDeliveries } from '@/hooks/use-deliveries';
import { Order, Medication } from '@/lib/types';
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
import { MedicationImage } from '@/components/medication-image';
import { Loader2, Plus, Pencil, Trash2, X, Check, Package, Search, Upload, ImageIcon, MapPin, Image } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importa mapa dinamicamente para evitar erro de SSR
const DeliveryMap = dynamic(
  () => import('@/components/delivery-map').then((mod) => mod.DeliveryMap),
  { ssr: false, loading: () => <div className="h-[300px] bg-muted rounded-lg animate-pulse" /> }
);

interface MedicationForm {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  requiresPrescription: boolean;
  image: string;
}

const emptyForm: MedicationForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '100',
  requiresPrescription: false,
  image: '',
};

const CATEGORIES = [
  'Analgésicos',
  'Anti-inflamatórios',
  'Antibióticos',
  'Anti-hipertensivos',
  'Antidiabéticos',
  'Colesterol',
  'Anticoagulantes',
  'Tireoide',
  'Ansiolíticos',
  'Antidepressivos',
  'Gripes e Resfriados',
  'Vitaminas',
  'Estômago',
  'Laxantes',
  'Antialérgicos',
  'Disfunção Erétil',
  'Dermatológicos',
  'Vermífugos',
  'Contraceptivos',
];

export function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { medications, isLoading: loadingMeds, isLoadingMore, hasMore, loadMore, addMedication, editMedication, removeMedication, refetch } = useMedications();
  const { orders, isLoading: loadingOrders, changeStatus, refetch: refetchOrders } = useOrders();
  const { deliveries, isLoading: loadingDeliveries } = useDeliveries();
  const [activeTab, setActiveTab] = useState<'orders' | 'medications' | 'deliveries' | 'banners' | 'settings'>('orders');
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [settingsData, setSettingsData] = useState({
    asaas_api_key: '',
    asaas_environment: 'sandbox',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [formData, setFormData] = useState<MedicationForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; title: string; message: string } | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  
  // Estados para banners
  interface Banner {
    id: string;
    title: string;
    subtitle: string;
    discount: string;
    bgColor: string;
    borderColor: string;
    image: string | null;
    action: string | null;
    active: boolean;
    order: number;
  }
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    discount: '',
    bgColor: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-100',
    image: '',
    action: '',
    active: true,
    order: 0
  });
  const [deleteBannerConfirm, setDeleteBannerConfirm] = useState<string | null>(null);

  // Scroll infinito para medicamentos
  useEffect(() => {
    if (!observerRef.current || activeTab !== 'medications') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchTerm) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, activeTab, searchTerm]);

  // Carrega configurações do Asaas
  useEffect(() => {
    if (activeTab === 'settings') {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          setSettingsData({
            asaas_api_key: data.asaas_api_key || '',
            asaas_environment: data.asaas_environment || 'sandbox',
          });
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Carrega banners
  const loadBanners = useCallback(async () => {
    setLoadingBanners(true);
    try {
      const res = await fetch('/api/banners?all=true');
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      console.error('Erro ao carregar banners');
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'banners') {
      loadBanners();
    }
  }, [activeTab, loadBanners]);

  // Salvar banner
  const handleSaveBanner = async () => {
    setIsSubmitting(true);
    try {
      const url = editingBannerId ? `/api/banners/${editingBannerId}` : '/api/banners';
      const method = editingBannerId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      });

      if (!res.ok) throw new Error('Erro ao salvar banner');

      setFeedback({
        type: 'success',
        title: 'Sucesso!',
        message: editingBannerId ? 'Banner atualizado com sucesso.' : 'Banner criado com sucesso.',
      });
      setShowBannerForm(false);
      setEditingBannerId(null);
      setBannerForm({
        title: '',
        subtitle: '',
        discount: '',
        bgColor: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-100',
        image: '',
        action: '',
        active: true,
        order: 0
      });
      loadBanners();
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar o banner.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir banner
  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setFeedback({
        type: 'success',
        title: 'Excluído!',
        message: 'Banner removido com sucesso.',
      });
      loadBanners();
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível excluir o banner.',
      });
    } finally {
      setDeleteBannerConfirm(null);
    }
  };

  // Editar banner
  const handleEditBanner = (banner: Banner) => {
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      discount: banner.discount,
      bgColor: banner.bgColor,
      borderColor: banner.borderColor,
      image: banner.image || '',
      action: banner.action || '',
      active: banner.active,
      order: banner.order
    });
    setEditingBannerId(banner.id);
    setShowBannerForm(true);
  };

  // Salvar configurações
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      setFeedback({
        type: 'success',
        title: 'Configurações salvas',
        message: 'As configurações do Asaas foram salvas com sucesso.',
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar as configurações.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        setFeedback({
          type: 'error',
          title: 'Falha no upload',
          message: error.error || 'Erro ao fazer upload da imagem.',
        });
        return;
      }

      const { url } = await res.json();
      setFormData((prev) => ({ ...prev, image: url }));
    } catch {
      setFeedback({
        type: 'error',
        title: 'Falha no upload',
        message: 'Erro ao fazer upload da imagem. Tente novamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (med: Medication) => {
    setFormData({
      name: med.name,
      description: med.description || '',
      price: med.price.toString(),
      category: med.category,
      stock: med.stock.toString(),
      requiresPrescription: med.requiresPrescription,
      image: med.image || '',
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const success = await removeMedication(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await changeStatus(orderId, newStatus);
      await refetchOrders();
      setFeedback({
        type: 'success',
        title: 'Status atualizado',
        message: `Pedido atualizado com sucesso!`,
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o status.',
      });
    }
  };

  const handleReleaseForDelivery = async (orderId: string) => {
    try {
      // Primeiro atualiza o status para shipped
      await changeStatus(orderId, 'shipped');
      
      // Depois cria a tarefa de entrega
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        throw new Error('Erro ao criar tarefa de entrega');
      }

      setFeedback({
        type: 'success',
        title: 'Pedido liberado!',
        message: 'O pedido foi liberado para entrega e está disponível para os entregadores.',
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível liberar o pedido para entrega.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        requiresPrescription: formData.requiresPrescription,
        stock: parseInt(formData.stock) || 100,
        image: formData.image || undefined,
      };

      if (editingId) {
        await editMedication(editingId, data);
      } else {
        await addMedication(data);
      }
      resetForm();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Erro ao salvar',
        message: err?.message || 'Erro ao salvar medicamento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedications = medications.filter(
    (m) => m && m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0),
    totalMeds: medications.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#2D1B4E] sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-white/60 text-sm font-medium px-2 py-1 bg-white/10 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">{user?.name}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de Pedidos', value: stats.totalOrders },
            { label: 'Pedidos Pendentes', value: stats.pendingOrders },
            { label: 'Receita Total', value: `R$${Number(stats.totalRevenue).toFixed(2)}` },
            { label: 'Medicamentos', value: stats.totalMeds },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'orders'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'deliveries'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Entregas
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'medications'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Medicamentos
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'banners'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Banners
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Configurações
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhum pedido
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
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
                  shipped: 'Saiu para Entrega',
                  delivered: 'Entregue',
                  cancelled: 'Cancelado',
                };
                const paymentStatusColors: Record<string, string> = {
                  PENDING: 'bg-amber-100 text-amber-800',
                  CONFIRMED: 'bg-green-100 text-green-800',
                  OVERDUE: 'bg-red-100 text-red-800',
                  REFUNDED: 'bg-gray-100 text-gray-800',
                  CANCELLED: 'bg-red-100 text-red-800',
                };
                const paymentStatusLabels: Record<string, string> = {
                  PENDING: '💳 Aguardando Pagamento',
                  CONFIRMED: '✅ Pago',
                  OVERDUE: '⚠️ Vencido',
                  REFUNDED: '↩️ Reembolsado',
                  CANCELLED: '❌ Cancelado',
                };
                const status = order.status.toLowerCase();
                const paymentStatus = order.paymentStatus || 'PENDING';
                const isPaymentConfirmed = paymentStatus === 'CONFIRMED';

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-base">Pedido #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                          <CardDescription>
                            {new Date(order.createdAt).toLocaleString('pt-BR')} • Cliente: {order.client?.name || 'N/A'}
                            {order.paymentMethod && ` • ${order.paymentMethod}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[paymentStatus] || 'bg-gray-100'}`}>
                            {paymentStatusLabels[paymentStatus] || paymentStatus}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
                            {statusLabels[status] || status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Itens do pedido:</p>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.medication?.name || `ID: ${item.medicationId.slice(0, 8)}`} × {item.quantity}
                              </span>
                              <span>R$ {Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Endereço de entrega:</p>
                        <p className="text-sm">{order.shippingAddress}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold">Total: R$ {Number(order.totalPrice).toFixed(2)}</span>
                        <div className="flex gap-2 items-center">
                          {status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                              >
                                Cancelar
                              </Button>
                              {isPaymentConfirmed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(order.id, 'confirmed')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprovar Pedido
                                </Button>
                              )}
                            </>
                          )}
                          {status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'processing')}
                            >
                              Iniciar Preparação
                            </Button>
                          )}
                          {status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => handleReleaseForDelivery(order.id)}
                            >
                              Liberar para Entrega
                            </Button>
                          )}
                          {(status === 'shipped' || status === 'delivered') && (
                            <span className="text-sm text-muted-foreground">
                              {status === 'shipped' ? 'Aguardando entregador' : 'Pedido finalizado'}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lista de entregas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Entregas em Andamento</h3>
              {loadingDeliveries ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : deliveries.filter(d => d.status.toLowerCase() === 'in_progress').length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma entrega em andamento
                  </CardContent>
                </Card>
              ) : (
                deliveries
                  .filter(d => d.status.toLowerCase() === 'in_progress')
                  .map((delivery) => (
                    <Card 
                      key={delivery.id} 
                      className={`cursor-pointer transition ${selectedDelivery === delivery.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedDelivery(delivery.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Pedido #{delivery.orderId?.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                            Em trânsito
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm">{delivery.customerAddress || 'Endereço não informado'}</p>
                        </div>
                        {delivery.deliveryPerson && (
                          <p className="text-sm text-muted-foreground">
                            Entregador: {delivery.deliveryPerson.name}
                          </p>
                        )}
                        {delivery.currentLatitude && delivery.currentLongitude && (
                          <p className="text-xs text-green-600">
                            📍 Localização ativa
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>

            {/* Mapa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mapa de Rastreamento</h3>
              {selectedDelivery ? (
                (() => {
                  const delivery = deliveries.find(d => d.id === selectedDelivery);
                  if (!delivery) return null;
                  return (
                    <div className="space-y-3">
                      <DeliveryMap
                        deliveryLat={delivery.currentLatitude}
                        deliveryLng={delivery.currentLongitude}
                        customerLat={delivery.customerLatitude}
                        customerLng={delivery.customerLongitude}
                        deliveryPersonName={delivery.deliveryPerson?.name || 'Entregador'}
                        customerAddress={delivery.customerAddress || 'Destino'}
                      />
                      <Card>
                        <CardContent className="py-3 text-sm">
                          <p><strong>Entregador:</strong> {delivery.deliveryPerson?.name}</p>
                          <p><strong>Destino:</strong> {delivery.customerAddress}</p>
                          {delivery.currentLatitude && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Última posição: {delivery.currentLatitude.toFixed(4)}, {delivery.currentLongitude?.toFixed(4)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Selecione uma entrega para ver no mapa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-6">
            {/* Header com busca e botão adicionar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar medicamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button onClick={() => setShowForm(true)} disabled={showForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Medicamento
              </Button>
            </div>

            {/* Formulário de cadastro/edição */}
            {showForm && (
              <Card className="border-primary/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {editingId ? 'Editar Medicamento' : 'Novo Medicamento'}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome *</label>
                        <Input
                          placeholder="Ex: Dipirona 500mg"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          required
                        >
                          <option value="">Selecione...</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição</label>
                        <textarea
                          placeholder="Descrição do medicamento..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Imagem do Produto</label>
                        <div className="flex gap-3">
                          {formData.image ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                              <img
                                src={formData.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, image: '' })}
                                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-center">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isUploading}
                              />
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition text-sm">
                                {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4" />
                                    Enviar imagem
                                  </>
                                )}
                              </div>
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WebP ou GIF (máx. 5MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço (R$) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estoque</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="100"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Receita</label>
                        <div className="flex items-center h-10">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.requiresPrescription}
                              onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">Requer receita médica</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de medicamentos */}
            {loadingMeds ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMedications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchTerm ? 'Nenhum medicamento encontrado' : 'Nenhum medicamento cadastrado'}
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  {filteredMedications.length} medicamento(s) encontrado(s)
                </p>
                <div className="h-[calc(100vh-320px)] overflow-y-auto pr-2 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedications.map((med) => (
                    <Card key={med.id} className="group hover:shadow-md transition">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <MedicationImage category={med.category} name={med.name} image={med.image} size="md" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight truncate">{med.name}</h3>
                            <p className="text-xs text-muted-foreground">{med.category}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-bold text-primary">R${Number(med.price).toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">• {med.stock} un.</span>
                            </div>
                            {med.requiresPrescription && (
                              <span className="inline-block text-[10px] bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 mt-1">
                                Receita
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/admin/medications/${med.id}/edit`)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          {deleteConfirm === med.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(med.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteConfirm(med.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>

                  {/* Scroll infinito - Observer e indicadores */}
                  <div ref={observerRef} className="py-4">
                    {isLoadingMore && (
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {!hasMore && medications.length > 0 && !searchTerm && (
                      <p className="text-center text-sm text-muted-foreground">
                        Todos os {medications.length} medicamentos carregados
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Banners Promocionais</h2>
                <p className="text-sm text-muted-foreground">Gerencie os banners do slideshow na tela inicial</p>
              </div>
              <Button 
                onClick={() => {
                  setBannerForm({
                    title: '',
                    subtitle: '',
                    discount: '',
                    bgColor: 'from-amber-50 to-orange-50',
                    borderColor: 'border-amber-100',
                    image: '',
                    action: '',
                    active: true,
                    order: banners.length
                  });
                  setEditingBannerId(null);
                  setShowBannerForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Banner
              </Button>
            </div>

            {showBannerForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingBannerId ? 'Editar Banner' : 'Novo Banner'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="Ex: Aproveite a Oferta"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subtítulo</label>
                      <Input
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        placeholder="Ex: Ofertas em Medicamentos"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Desconto/Destaque</label>
                      <Input
                        value={bannerForm.discount}
                        onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })}
                        placeholder="Ex: 20 ou Grátis"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL da Imagem</label>
                      <Input
                        value={bannerForm.image}
                        onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                        placeholder="/images/banner.png"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cor de Fundo (gradient)</label>
                      <Input
                        value={bannerForm.bgColor}
                        onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                        placeholder="from-amber-50 to-orange-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cor da Borda</label>
                      <Input
                        value={bannerForm.borderColor}
                        onChange={(e) => setBannerForm({ ...bannerForm, borderColor: e.target.value })}
                        placeholder="border-amber-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ordem</label>
                      <Input
                        type="number"
                        value={bannerForm.order}
                        onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bannerActive"
                      checked={bannerForm.active}
                      onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="bannerActive" className="text-sm font-medium">Banner ativo</label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowBannerForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveBanner} disabled={isSubmitting || !bannerForm.title}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingBannerId ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingBanners ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : banners.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum banner cadastrado</p>
                  <p className="text-sm">Clique em "Novo Banner" para adicionar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <Card key={banner.id} className={`overflow-hidden ${!banner.active ? 'opacity-50' : ''}`}>
                    <div className={`flex bg-gradient-to-r ${banner.bgColor} border-b ${banner.borderColor}`}>
                      <div className="flex-1 p-4">
                        <p className="text-muted-foreground text-xs">{banner.subtitle}</p>
                        <h3 className="font-bold">{banner.title}</h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          {banner.discount !== 'Grátis' ? (
                            <>
                              <span className="text-2xl font-bold text-primary">{banner.discount}</span>
                              <span className="text-sm font-bold text-primary">%</span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-primary">{banner.discount}</span>
                          )}
                        </div>
                      </div>
                      {banner.image && (
                        <div className="w-24 h-24 relative">
                          <img 
                            src={banner.image} 
                            alt={banner.title}
                            className="absolute inset-0 w-full h-full object-cover rounded-l-2xl"
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-3 pb-3 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Ordem: {banner.order}</span>
                        <span>•</span>
                        <span className={banner.active ? 'text-green-600' : 'text-red-600'}>
                          {banner.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditBanner(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setDeleteBannerConfirm(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <AlertDialog open={!!deleteBannerConfirm} onOpenChange={(open) => !open && setDeleteBannerConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Banner?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O banner será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteBannerConfirm && handleDeleteBanner(deleteBannerConfirm)}
                  >
                    Excluir
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integração Asaas</CardTitle>
                <CardDescription>
                  Configure as credenciais do gateway de pagamento Asaas para processar pagamentos via PIX, Boleto e Cartão de Crédito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ambiente</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="environment"
                        value="sandbox"
                        checked={settingsData.asaas_environment === 'sandbox'}
                        onChange={(e) => setSettingsData({ ...settingsData, asaas_environment: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Sandbox (Testes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="environment"
                        value="production"
                        checked={settingsData.asaas_environment === 'production'}
                        onChange={(e) => setSettingsData({ ...settingsData, asaas_environment: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Produção</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    placeholder="$aact_..."
                    value={settingsData.asaas_api_key}
                    onChange={(e) => setSettingsData({ ...settingsData, asaas_api_key: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre sua API Key no painel do Asaas em Configurações &gt; Integrações &gt; API.
                  </p>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSavingSettings || !settingsData.asaas_api_key}
                  className="w-full"
                >
                  {isSavingSettings ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Salvar Configurações</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook</CardTitle>
                <CardDescription>
                  Configure este webhook no painel do Asaas para receber notificações de pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do Webhook</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/asaas` : ''}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/asaas`);
                        setFeedback({
                          type: 'success',
                          title: 'Copiado!',
                          message: 'URL do webhook copiada para a área de transferência.',
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No Asaas: Configurações → Integrações → Webhooks → Adicionar
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Sandbox:</strong> Use para testes. Nenhuma cobrança real será feita.
                </p>
                <p>
                  <strong>Produção:</strong> Use apenas quando estiver pronto para receber pagamentos reais.
                </p>
                <p>
                  Para criar uma conta Asaas, acesse{' '}
                  <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    www.asaas.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <AlertDialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {feedback?.type === 'error' ? 'Ops! Algo deu errado' : 'Tudo certo!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {feedback?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full" onClick={() => setFeedback(null)}>
              Ok
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
