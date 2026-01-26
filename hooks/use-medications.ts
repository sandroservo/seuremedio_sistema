/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Hook para gerenciamento de medicamentos com scroll infinito
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Medication } from '@/lib/types';
import { 
  fetchMedicationsPaginated, 
  fetchAllMedications,
  createMedication, 
  updateMedication, 
  deleteMedication 
} from '@/lib/api';
import { getMedications as getMedicationsFromStorage } from '@/lib/storage';

const ITEMS_PER_PAGE = 12;

interface UseMedicationsReturn {
  medications: Medication[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  addMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => Promise<Medication | null>;
  editMedication: (id: string, updates: Partial<Medication>) => Promise<Medication | null>;
  removeMedication: (id: string) => Promise<boolean>;
}

export function useMedications(loadAll: boolean = false, pharmacyId?: string): UseMedicationsReturn {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const loadMedications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    
    try {
      // Se loadAll = true, carrega todos os medicamentos (para admin)
      if (loadAll && pageNum === 1) {
        const allMeds = await fetchAllMedications();
        const validData = allMeds.filter(m => m && m.id);
        setMedications(validData);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const result = await fetchMedicationsPaginated(pageNum, ITEMS_PER_PAGE);
      const validData = result.data.filter(m => m && m.id);
      if (append) {
        setMedications(prev => [...prev.filter(m => m && m.id), ...validData]);
      } else {
        setMedications(validData);
      }
      setTotalPages(result.totalPages);
      setHasMore(pageNum < result.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.warn('API indisponível, usando localStorage:', err);
      const localData = getMedicationsFromStorage();
      setMedications(localData);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [loadAll]);

  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      await loadMedications(page + 1, true);
    }
  }, [isLoadingMore, hasMore, page, loadMedications]);

  useEffect(() => {
    loadMedications(1, false);
  }, [loadMedications]);

  const addMedication = async (
    med: Omit<Medication, 'id' | 'createdAt'>
  ): Promise<Medication | null> => {
    try {
      const newMed = await createMedication(med);
      if (newMed && newMed.id) {
        // Converte price de string para number se necessário
        const normalizedMed = {
          ...newMed,
          price: typeof newMed.price === 'string' ? parseFloat(newMed.price) : newMed.price,
        };
        setMedications(prev => [...prev.filter(m => m && m.id), normalizedMed]);
        return normalizedMed;
      }
      return null;
    } catch (err: any) {
      console.error('Erro ao adicionar medicamento:', err);
      setError(err?.message || 'Erro ao adicionar medicamento');
      throw err; // Propaga o erro para o componente
    }
  };

  const editMedication = async (
    id: string, 
    updates: Partial<Medication>
  ): Promise<Medication | null> => {
    try {
      const updated = await updateMedication(id, updates);
      setMedications(prev => 
        prev.filter(m => m).map(m => m.id === id ? updated : m)
      );
      return updated;
    } catch (err) {
      setError('Erro ao atualizar medicamento');
      return null;
    }
  };

  const removeMedication = async (id: string): Promise<boolean> => {
    try {
      await deleteMedication(id);
      setMedications(prev => prev.filter(m => m && m.id !== id));
      return true;
    } catch (err) {
      setError('Erro ao remover medicamento');
      return false;
    }
  };

  return {
    medications,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch: () => loadMedications(1, false),
    addMedication,
    editMedication,
    removeMedication,
  };
}
