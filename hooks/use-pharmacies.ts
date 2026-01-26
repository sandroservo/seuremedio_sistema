'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    users: number;
    medications: number;
    orders: number;
  };
}

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pharmacies');
      if (!res.ok) throw new Error('Erro ao carregar farmácias');
      const data = await res.json();
      setPharmacies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  const createPharmacy = async (data: Partial<Pharmacy>) => {
    const res = await fetch('/api/pharmacies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao criar farmácia');
    await fetchPharmacies();
    return res.json();
  };

  const updatePharmacy = async (id: string, data: Partial<Pharmacy>) => {
    const res = await fetch(`/api/pharmacies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar farmácia');
    await fetchPharmacies();
    return res.json();
  };

  const deletePharmacy = async (id: string) => {
    const res = await fetch(`/api/pharmacies/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir farmácia');
    await fetchPharmacies();
  };

  const toggleActive = async (id: string, active: boolean) => {
    return updatePharmacy(id, { active });
  };

  return {
    pharmacies,
    isLoading,
    error,
    refetch: fetchPharmacies,
    createPharmacy,
    updatePharmacy,
    deletePharmacy,
    toggleActive,
  };
}
