export type UserRole = 'CLIENT' | 'ADMIN' | 'DELIVERY' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  pharmacyId?: string;
  createdAt: Date;
}

export interface Medication {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  requiresPrescription: boolean;
  stock: number;
  image?: string;
  createdAt: Date;
}

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED';

export interface Order {
  id: string;
  clientId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryId?: string;
  shippingAddress: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relacionamentos incluídos pela API
  client?: { id: string; name: string; email?: string; phone?: string };
  deliveryTask?: DeliveryTask;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  medicationId: string;
  quantity: number;
  price: number;
  // Relacionamento incluído pela API
  medication?: { id: string; name: string; image?: string };
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  deliveryPersonId: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  customerAddress?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  customerLatitude?: number;
  customerLongitude?: number;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  // Relacionamentos incluídos pela API
  order?: Order & {
    client?: { id: string; name: string; phone?: string };
  };
  deliveryPerson?: { id: string; name: string; phone?: string };
}

// Tipos extendidos para compatibilidade
export interface OrderWithRelations extends Order {
  client?: { id: string; name: string; email?: string; phone?: string };
  items: (OrderItem & { medication?: { id: string; name: string; image?: string } })[];
  deliveryTask?: DeliveryTask;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
