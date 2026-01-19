import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  holderName: string;
  isDefault: boolean;
}

export interface BankCardInput {
  bankName: string;
  cardNumber: string;
  accountName: string;
  isDefault?: boolean;
}

export function useBankCards() {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getBankCards();
      const list = (res?.data?.bankCards || []).map((c: any) => ({
        id: c.id,
        bankName: c.bankName,
        cardNumber: `**** **** **** ${String(c.cardNumber).slice(-4)}`,
        holderName: c.accountName,
        isDefault: !!c.isDefault,
      }));
      setCards(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch bank cards');
      console.error('Fetch bank cards error:', e);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = useCallback(async (input: BankCardInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.addBankCard({
        ...input,
        isDefault: input.isDefault ?? cards.length === 0,
      });
      const list = (res?.data?.bankCards || []).map((c: any) => ({
        id: c.id,
        bankName: c.bankName,
        cardNumber: `**** **** **** ${String(c.cardNumber).slice(-4)}`,
        holderName: c.accountName,
        isDefault: !!c.isDefault,
      }));
      setCards(list);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to add card';
      setError(errorMsg);
      console.error('Add bank card error:', e);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [cards.length]);

  const deleteCard = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.deleteBankCard(id);
      const list = (res?.data?.bankCards || []).map((c: any) => ({
        id: c.id,
        bankName: c.bankName,
        cardNumber: `**** **** **** ${String(c.cardNumber).slice(-4)}`,
        holderName: c.accountName,
        isDefault: !!c.isDefault,
      }));
      setCards(list);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to delete card';
      setError(errorMsg);
      console.error('Delete bank card error:', e);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefault = useCallback((id: string) => {
    setCards(prevCards => prevCards.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
  }, []);

  return {
    cards,
    isLoading,
    error,
    addCard,
    deleteCard,
    setDefault,
    refetch: fetchCards,
  };
}
