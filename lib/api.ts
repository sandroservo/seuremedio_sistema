/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Camada de API - Consumo das API Routes
 */

import { Medication, Order, User, DeliveryTask } from './types';

const API_BASE = '/api';

// ============ MEDICAMENTOS ============

export async function fetchMedications(): Promise<Medication[]> {
  const res = await fetch(`${API_BASE}/medications?limit=200`);
  if (!res.ok) throw new Error('Erro ao buscar medicamentos');
  const json = await res.json();
  return (json.data || []).map((med: Record<string, unknown>) => ({
    ...med,
    price: typeof med.price === 'string' ? parseFloat(med.price) : med.price,
  }));
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function fetchMedicationsPaginated(
  page: number = 1, 
  limit: number = 12
): Promise<PaginatedResult<Medication>> {
  const res = await fetch(`${API_BASE}/medications?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Erro ao buscar medicamentos');
  const json = await res.json();
  
  const data = (json.data || []).map((med: Record<string, unknown>) => ({
    ...med,
    price: typeof med.price === 'string' ? parseFloat(med.price) : med.price,
  }));

  return {
    data,
    page: json.pagination?.page || page,
    limit: json.pagination?.limit || limit,
    total: json.pagination?.total || data.length,
    totalPages: json.pagination?.totalPages || 1,
  };
}

export async function fetchMedication(id: string): Promise<Medication | null> {
  const res = await fetch(`${API_BASE}/medications/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.medication || null;
}

export async function fetchAllMedications(): Promise<Medication[]> {
  const res = await fetch(`${API_BASE}/medications?limit=1000`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function createMedication(medication: Omit<Medication, 'id' | 'createdAt'>): Promise<Medication> {
  const res = await fetch(`${API_BASE}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medication),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro ao criar medicamento');
  }
  return await res.json();
}

export async function updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
  const res = await fetch(`${API_BASE}/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro ao atualizar medicamento');
  }
  const data = await res.json();
  return data.medication || data;
}

export async function deleteMedication(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/medications/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao deletar medicamento');
}

// ============ PEDIDOS ============

export async function fetchOrders(clientId?: string): Promise<Order[]> {
  const url = clientId 
    ? `${API_BASE}/orders?clientId=${clientId}` 
    : `${API_BASE}/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao buscar pedidos');
  const data = await res.json();
  return data.data || [];
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.order || null;
}

interface CreateOrderInput {
  clientId: string;
  shippingAddress: string;
  notes?: string;
  paymentMethod?: string;
  items: Array<{
    medicationId: string;
    quantity: number;
    price: number;
  }>;
}

export async function createOrder(order: CreateOrderInput): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro ao criar pedido');
  }
  return await res.json();
}

export async function updateOrderStatus(
  id: string, 
  status: Order['status']
): Promise<Order> {
  // Converte para uppercase para o banco
  const dbStatus = status.toUpperCase();
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: dbStatus }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status do pedido');
  return await res.json();
}

// ============ USUÁRIOS ============

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Erro ao buscar usuários');
  const data = await res.json();
  return data.users || [];
}

export async function fetchUser(id: string): Promise<User | null> {
  const res = await fetch(`${API_BASE}/users/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Erro ao criar usuário');
  }
  const data = await res.json();
  return data.user;
}

// ============ ENTREGAS ============

export async function fetchDeliveries(deliveryPersonId?: string): Promise<DeliveryTask[]> {
  const url = deliveryPersonId 
    ? `${API_BASE}/deliveries?deliveryPersonId=${deliveryPersonId}` 
    : `${API_BASE}/deliveries`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao buscar entregas');
  const data = await res.json();
  return data.data || [];
}

export async function fetchDelivery(id: string): Promise<DeliveryTask | null> {
  const res = await fetch(`${API_BASE}/deliveries/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.delivery || null;
}

interface CreateDeliveryInput {
  orderId: string;
  deliveryPersonId: string;
  customerLocation: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  estimatedDeliveryTime?: Date;
}

export async function createDelivery(delivery: CreateDeliveryInput): Promise<DeliveryTask> {
  const res = await fetch(`${API_BASE}/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delivery),
  });
  if (!res.ok) throw new Error('Erro ao criar entrega');
  const data = await res.json();
  return data.delivery;
}

export async function updateDeliveryStatus(
  id: string, 
  status: DeliveryTask['status'],
  location?: { latitude: number; longitude: number }
): Promise<DeliveryTask> {
  // Converte para uppercase para o banco
  const dbStatus = status.toUpperCase();
  const res = await fetch(`${API_BASE}/deliveries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: dbStatus, ...location }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status da entrega');
  return await res.json();
}
