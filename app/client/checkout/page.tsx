/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Página de Checkout - Finalização da compra
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMedications } from '@/hooks/use-medications';
import { useOrders } from '@/hooks/use-orders';
import { OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { MedicationImage } from '@/components/medication-image';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck, 
  Check, 
  Loader2,
  ShoppingBag,
  Banknote,
  QrCode,
  Clock,
  Package
} from 'lucide-react';

interface CartItem {
  medicationId: string;
  quantity: number;
}

type PaymentMethod = 'pix' | 'credit' | 'cash';

const DELIVERY_FEE = 5.99;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { medications } = useMedications();
  const { addOrder } = useOrders(user?.id);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'address' | 'payment' | 'confirm'>('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do formulário
  const [address, setAddress] = useState({
    street: user?.address || '',
    number: '',
    complement: '',
    neighborhood: '',
    state: '',
    city: '',
    zipCode: '',
    reference: '',
  });
  
  // Estados e cidades
  const [states, setStates] = useState<{ uf: string; name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  
  // Dados do cliente para pagamento Asaas
  const [customerData, setCustomerData] = useState({
    cpf: '',
  });
  
  // Dados para troco
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  
  // Dados do pagamento Asaas
  const [asaasConfigured, setAsaasConfigured] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCodeUrl?: string;
    copiaECola?: string;
    paymentId?: string;
  } | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  // Verificar se Asaas está configurado
  useEffect(() => {
    fetch('/api/payments/check')
      .then(res => res.json())
      .then(data => setAsaasConfigured(data.configured))
      .catch(() => setAsaasConfigured(false));
  }, []);

  // Carregar estados brasileiros
  useEffect(() => {
    fetch('/api/locations/states')
      .then(res => res.json())
      .then(data => setStates(data))
      .catch(() => setStates([]));
  }, []);

  // Carregar cidades quando o estado muda
  useEffect(() => {
    if (address.state) {
      fetch(`/api/locations/cities?uf=${address.state}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(() => setCities([]));
    } else {
      setCities([]);
    }
  }, [address.state]);

  // Carregar carrinho do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('seuremedio_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (parsed.items) {
          const items: CartItem[] = Object.entries(parsed.items).map(([medicationId, quantity]) => ({
            medicationId,
            quantity: quantity as number,
          }));
          setCart(items);
          if (parsed.pharmacyId) {
            setPharmacyId(parsed.pharmacyId);
          }
        } else {
          const items: CartItem[] = Object.entries(parsed).map(([medicationId, quantity]) => ({
            medicationId,
            quantity: quantity as number,
          }));
          setCart(items);
        }
      } catch {
        setCart([]);
      }
    }
  }, []);

  // Carregar endereço salvo
  useEffect(() => {
    const savedAddress = localStorage.getItem('seuremedio_address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch {}
    }
  }, []);

  const cartMedications = cart.map(item => {
    const med = medications.find(m => m.id === item.medicationId);
    return { ...item, medication: med };
  }).filter(item => item.medication);

  const subtotal = cartMedications.reduce((sum, item) => {
    return sum + (Number(item.medication?.price) || 0) * item.quantity;
  }, 0);

  const total = subtotal + DELIVERY_FEE;

  const handleAddressSubmit = () => {
    if (!address.street || !address.number || !address.neighborhood || !address.state || !address.city || !address.zipCode) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    localStorage.setItem('seuremedio_address', JSON.stringify(address));
    setError(null);
    setStep('payment');
  };

  const handlePaymentSubmit = () => {
    if (paymentMethod === 'credit') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        setError('Preencha os dados do cartão');
        return;
      }
    }
    
    // Validar CPF se Asaas estiver configurado e for PIX ou Cartão
    if (asaasConfigured && (paymentMethod === 'pix' || paymentMethod === 'credit')) {
      if (!customerData.cpf || customerData.cpf.replace(/\D/g, '').length !== 11) {
        setError('CPF inválido');
        return;
      }
    }
    
    setError(null);
    setStep('confirm');
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const items: OrderItem[] = cartMedications.map(item => ({
        medicationId: item.medicationId,
        quantity: item.quantity,
        price: Number(item.medication?.price) || 0,
      }));

      const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${address.city} - CEP: ${address.zipCode}${address.reference ? ` (Ref: ${address.reference})` : ''}`;

      let orderNotes = '';
      if (paymentMethod === 'cash' && needsChange && changeAmount) {
        orderNotes = `💵 Troco para R$ ${changeAmount}`;
      }
      
      const paymentMethodMap: Record<PaymentMethod, string> = {
        pix: 'pix',
        credit: 'credit_card',
        cash: 'cash',
      };

      const order = await addOrder({
        clientId: user.id,
        shippingAddress: fullAddress,
        items,
        paymentMethod: paymentMethodMap[paymentMethod],
        ...(orderNotes && { notes: orderNotes }),
        ...(pharmacyId && { pharmacyId }),
      });

      const orderId = order?.id || 'PEDIDO-' + Date.now();

      // Se Asaas está configurado, gerar cobrança
      if (asaasConfigured && order?.id) {
        if (paymentMethod === 'pix') {
          setIsGeneratingPix(true);
          try {
            const paymentRes = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                paymentMethod: 'pix',
                customer: {
                  name: user.name,
                  email: user.email,
                  cpfCnpj: customerData.cpf.replace(/\D/g, ''),
                  phone: user.phone,
                },
              }),
            });

            if (paymentRes.ok) {
              const payment = await paymentRes.json();
              setPixData({
                qrCodeUrl: payment.pixQrCodeUrl,
                copiaECola: payment.pixCopiaECola,
                paymentId: payment.paymentId,
              });
            }
          } catch {
            // Continua mesmo se falhar o PIX
          } finally {
            setIsGeneratingPix(false);
          }
        } else if (paymentMethod === 'credit') {
          // Processar cartão de crédito
          try {
            const [expiryMonth, expiryYear] = cardData.expiry.split('/');
            const paymentRes = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                paymentMethod: 'credit_card',
                customer: {
                  name: user.name,
                  email: user.email,
                  cpfCnpj: customerData.cpf.replace(/\D/g, ''),
                  phone: user.phone,
                },
                creditCard: {
                  holderName: cardData.name,
                  number: cardData.number,
                  expiryMonth: expiryMonth?.trim(),
                  expiryYear: expiryYear?.trim()?.length === 2 ? '20' + expiryYear.trim() : expiryYear?.trim(),
                  ccv: cardData.cvv,
                },
                creditCardHolderInfo: {
                  name: cardData.name,
                  email: user.email,
                  cpfCnpj: customerData.cpf,
                  phone: user.phone,
                  postalCode: address.zipCode,
                  addressNumber: address.number,
                },
              }),
            });

            if (!paymentRes.ok) {
              const errorData = await paymentRes.json();
              throw new Error(errorData.error || 'Erro ao processar cartão');
            }
          } catch (paymentErr: any) {
            setError(paymentErr.message || 'Erro ao processar pagamento com cartão');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Limpar carrinho
      localStorage.removeItem('seuremedio_cart');
      
      setOrderSuccess({ orderId });
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    router.push('/client/dashboard');
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground mb-4">Adicione itens ao carrinho para continuar</p>
        <Button onClick={() => router.push('/client/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às compras
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#2D1B4E] sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo size="sm" />
            <span className="text-white font-medium text-sm sm:text-base">Checkout</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/client/dashboard')}
            className="text-white hover:bg-white/10 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-muted/50 border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'review', label: 'Revisão', icon: ShoppingBag },
              { key: 'address', label: 'Endereço', icon: MapPin },
              { key: 'payment', label: 'Pagamento', icon: CreditCard },
              { key: 'confirm', label: 'Confirmação', icon: Check },
            ].map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.key;
              const isPast = ['review', 'address', 'payment', 'confirm'].indexOf(step) > i;
              
              return (
                <div key={s.key} className="flex items-center">
                  <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isPast ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                      {isPast ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 3 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${isPast ? 'bg-green-600' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Step: Review */}
            {step === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Revise seus itens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartMedications.map(item => (
                    <div key={item.medicationId} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <MedicationImage 
                        category={item.medication?.category || ''} 
                        name={item.medication?.name || ''} 
                        image={item.medication?.image}
                        size="sm" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.medication?.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.medication?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {(Number(item.medication?.price) * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}x R$ {Number(item.medication?.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => setStep('address')}>
                      Continuar para endereço
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Address */}
            {step === 'address' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Rua *</label>
                      <Input
                        placeholder="Nome da rua"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Número *</label>
                      <Input
                        placeholder="123"
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Complemento</label>
                      <Input
                        placeholder="Apto, bloco..."
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bairro *</label>
                      <Input
                        placeholder="Bairro"
                        value={address.neighborhood}
                        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Estado *</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value, city: '' })}
                      >
                        <option value="">Selecione</option>
                        {states.map((s) => (
                          <option key={s.uf} value={s.uf}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cidade *</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        disabled={!address.state}
                      >
                        <option value="">{address.state ? 'Selecione a cidade' : 'Selecione o estado primeiro'}</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">CEP *</label>
                      <Input
                        placeholder="00000-000"
                        value={address.zipCode}
                        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Ponto de referência</label>
                    <Input
                      placeholder="Próximo ao mercado..."
                      value={address.reference}
                      onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('review')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button onClick={handleAddressSubmit}>
                      Continuar para pagamento
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Payment */}
            {step === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Forma de pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { key: 'pix', label: 'PIX', icon: QrCode, desc: 'Instantâneo' },
                      { key: 'credit', label: 'Crédito', icon: CreditCard, desc: 'Até 12x' },
                      { key: 'cash', label: 'Dinheiro', icon: Banknote, desc: 'Na entrega' },
                    ].map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.key}
                          onClick={() => setPaymentMethod(method.key as PaymentMethod)}
                          className={`p-3 sm:p-4 rounded-xl border-2 text-center transition active:scale-95 min-h-[70px] ${
                            paymentMethod === method.key
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mx-auto mb-1 sm:mb-2 ${paymentMethod === method.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="font-medium text-xs sm:text-sm">{method.label}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{method.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'credit' && (
                    <div className="space-y-4 pt-4 border-t">
                      {asaasConfigured && (
                        <div>
                          <label className="text-sm font-medium">CPF do titular *</label>
                          <Input
                            placeholder="000.000.000-00"
                            value={customerData.cpf}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const formatted = value
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                                .slice(0, 14);
                              setCustomerData({ ...customerData, cpf: formatted });
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Número do cartão</label>
                        <Input
                          placeholder="0000 0000 0000 0000"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Nome no cartão</label>
                        <Input
                          placeholder="Como está no cartão"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Validade</label>
                          <Input
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">CVV</label>
                          <Input
                            placeholder="123"
                            type="password"
                            maxLength={4}
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="space-y-4">
                      {asaasConfigured && (
                        <div>
                          <label className="text-sm font-medium">CPF *</label>
                          <Input
                            placeholder="000.000.000-00"
                            value={customerData.cpf}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const formatted = value
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                                .slice(0, 14);
                              setCustomerData({ ...customerData, cpf: formatted });
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Necessário para gerar a cobrança PIX
                          </p>
                        </div>
                      )}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <QrCode className="h-12 w-12 mx-auto text-green-600 mb-2" />
                        <p className="text-sm text-green-800">
                          {asaasConfigured 
                            ? 'O QR Code PIX será gerado após a confirmação' 
                            : 'O QR Code será gerado após a confirmação do pedido'}
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Banknote className="h-6 w-6 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800">Pagamento na entrega</p>
                            <p className="text-sm text-amber-700">
                              Tenha o valor em mãos.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="needsChange"
                          checked={needsChange}
                          onChange={(e) => setNeedsChange(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="needsChange" className="text-sm font-medium">
                          Preciso de troco
                        </label>
                      </div>
                      {needsChange && (
                        <div>
                          <label className="text-sm font-medium">Troco para quanto?</label>
                          <Input
                            placeholder="Ex: 100,00"
                            value={changeAmount}
                            onChange={(e) => setChangeAmount(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Informe o valor da nota que você vai pagar
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('address')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button onClick={handlePaymentSubmit}>
                      Revisar pedido
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirme seu pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Address Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Endereço de entrega</p>
                        <p className="text-sm text-muted-foreground">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.neighborhood}, {address.city} - CEP: {address.zipCode}
                        </p>
                        {address.reference && (
                          <p className="text-sm text-muted-foreground">Ref: {address.reference}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Forma de pagamento</p>
                        <p className="text-sm text-muted-foreground">
                          {paymentMethod === 'pix' && 'PIX - Aprovação imediata'}
                          {paymentMethod === 'credit' && `Cartão de crédito final ${cardData.number.slice(-4)}`}
                                                    {paymentMethod === 'cash' && (needsChange && changeAmount ? `Dinheiro na entrega (Troco para R$ ${changeAmount})` : 'Dinheiro na entrega')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Time */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Previsão de entrega</p>
                        <p className="text-sm text-green-700">30-60 minutos</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('payment')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleConfirmOrder}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar pedido
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Resumo do pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {cartMedications.slice(0, 3).map(item => (
                    <div key={item.medicationId} className="flex justify-between">
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {item.quantity}x {item.medication?.name}
                      </span>
                      <span>R$ {(Number(item.medication?.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {cartMedications.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      + {cartMedications.length - 3} item(s)
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Entrega
                    </span>
                    <span>R$ {DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Entrega em 30-60 min
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AlertDialog open={!!orderSuccess} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">Pedido confirmado!</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3 text-muted-foreground text-sm">
                <span>Seu pedido foi realizado com sucesso.</span>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground block">Número do pedido</span>
                  <span className="font-mono font-bold text-primary block">#{orderSuccess?.orderId.slice(0, 8).toUpperCase()}</span>
                </div>
                
                {/* PIX QR Code */}
                {isGeneratingPix && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-2" />
                    <p className="text-sm text-green-800">Gerando PIX...</p>
                  </div>
                )}
                
                {pixData?.qrCodeUrl && (
                  <div className="p-4 bg-green-50 rounded-lg space-y-3">
                    <p className="font-medium text-green-800">Pague com PIX</p>
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeUrl}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 mx-auto border-4 border-white rounded-lg shadow"
                    />
                    {pixData.copiaECola && (
                      <div className="space-y-2">
                        <p className="text-xs text-green-700">Ou copie o código:</p>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={pixData.copiaECola}
                            className="w-full text-xs p-2 pr-16 bg-white border rounded font-mono truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(pixData.copiaECola || '');
                            }}
                            className="absolute right-1 top-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!pixData && !isGeneratingPix && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Previsão: 30-60 minutos</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full" onClick={handleSuccessClose}>
              Acompanhar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
