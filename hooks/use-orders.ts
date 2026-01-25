/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Hook para gerenciamento de pedidos
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/lib/types';
import { 
  fetchOrders, 
  createOrder, 
  updateOrderStatus 
} from '@/lib/api';
import { getOrders as getOrdersFromStorage } from '@/lib/storage';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addOrder: (order: Parameters<typeof createOrder>[0]) => Promise<Order | null>;
  changeStatus: (id: string, status: Order['status']) => Promise<Order | null>;
}

export function useOrders(clientId?: string): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchOrders(clientId);
      setOrders(data);
    } catch (err) {
      console.warn('API indisponível, usando localStorage:', err);
      const localData = getOrdersFromStorage();
      const filtered = clientId 
        ? localData.filter(o => o.clientId === clientId)
        : localData;
      setOrders(filtered);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadOrders();
    
    // Polling silencioso: atualiza a cada 5 segundos sem loading
    const interval = setInterval(() => {
      loadOrders(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadOrders]);

  const addOrder = async (
    order: Parameters<typeof createOrder>[0]
  ): Promise<Order | null> => {
    try {
      const newOrder = await createOrder(order);
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    } catch (err) {
      setError('Erro ao criar pedido');
      return null;
    }
  };

  const changeStatus = async (
    id: string, 
    status: Order['status']
  ): Promise<Order | null> => {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders(prev => 
        prev.map(o => o.id === id ? updated : o)
      );
      return updated;
    } catch (err) {
      setError('Erro ao atualizar status');
      return null;
    }
  };

  return {
    orders,
    isLoading,
    error,
    refetch: loadOrders,
    addOrder,
    changeStatus,
  };
}
