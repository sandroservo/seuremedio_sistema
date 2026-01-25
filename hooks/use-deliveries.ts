/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Hook para gerenciamento de entregas
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DeliveryTask } from '@/lib/types';
import { 
  fetchDeliveries, 
  createDelivery, 
  updateDeliveryStatus 
} from '@/lib/api';
import { getDeliveries as getDeliveriesFromStorage } from '@/lib/storage';

interface UseDeliveriesReturn {
  deliveries: DeliveryTask[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addDelivery: (delivery: Parameters<typeof createDelivery>[0]) => Promise<DeliveryTask | null>;
  changeStatus: (
    id: string, 
    status: DeliveryTask['status'],
    location?: { latitude: number; longitude: number }
  ) => Promise<DeliveryTask | null>;
}

export function useDeliveries(deliveryPersonId?: string): UseDeliveriesReturn {
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeliveries = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchDeliveries(deliveryPersonId);
      setDeliveries(data);
    } catch (err) {
      console.warn('API indisponível, usando localStorage:', err);
      const localData = getDeliveriesFromStorage();
      const filtered = deliveryPersonId 
        ? localData.filter(d => d.deliveryPersonId === deliveryPersonId)
        : localData;
      setDeliveries(filtered);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [deliveryPersonId]);

  useEffect(() => {
    loadDeliveries();
    
    // Polling silencioso: atualiza a cada 5 segundos sem loading
    const interval = setInterval(() => {
      loadDeliveries(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  const addDelivery = async (
    delivery: Parameters<typeof createDelivery>[0]
  ): Promise<DeliveryTask | null> => {
    try {
      const newDelivery = await createDelivery(delivery);
      setDeliveries(prev => [...prev, newDelivery]);
      return newDelivery;
    } catch (err) {
      setError('Erro ao criar entrega');
      return null;
    }
  };

  const changeStatus = async (
    id: string, 
    status: DeliveryTask['status'],
    location?: { latitude: number; longitude: number }
  ): Promise<DeliveryTask | null> => {
    try {
      const updated = await updateDeliveryStatus(id, status, location);
      setDeliveries(prev => 
        prev.map(d => d.id === id ? updated : d)
      );
      return updated;
    } catch (err) {
      setError('Erro ao atualizar status');
      return null;
    }
  };

  return {
    deliveries,
    isLoading,
    error,
    refetch: loadDeliveries,
    addDelivery,
    changeStatus,
  };
}
