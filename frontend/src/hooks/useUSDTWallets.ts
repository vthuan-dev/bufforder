import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface USDTWallet {
  id: string;
  walletAddress: string;
  walletName: string;
  network: string;
  isDefault: boolean;
}

export interface USDTWalletInput {
  walletAddress: string;
  walletName: string;
  network: string;
  isDefault?: boolean;
}

export function useUSDTWallets() {
  const [wallets, setWallets] = useState<USDTWallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getUsdtWallets();
      setWallets(res?.data?.usdtWallets || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch USDT wallets');
      console.error('Fetch USDT wallets error:', e);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = useCallback(async (input: USDTWalletInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.addUsdtWallet({
        ...input,
        isDefault: input.isDefault ?? wallets.length === 0,
      });
      setWallets(res?.data?.usdtWallets || []);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to add wallet';
      setError(errorMsg);
      console.error('Add USDT wallet error:', e);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [wallets.length]);

  const deleteWallet = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.deleteUsdtWallet(id);
      setWallets(res?.data?.usdtWallets || []);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to delete wallet';
      setError(errorMsg);
      console.error('Delete USDT wallet error:', e);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefault = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.setDefaultUsdtWallet(id);
      setWallets(res?.data?.usdtWallets || []);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to set default';
      setError(errorMsg);
      console.error('Set default USDT wallet error:', e);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    wallets,
    isLoading,
    error,
    addWallet,
    deleteWallet,
    setDefault,
    refetch: fetchWallets,
  };
}
