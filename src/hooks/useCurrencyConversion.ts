import { useState, useEffect } from 'react';
import { Currency } from '@/components/transactions/AmountInput/CurrencySelector';

interface ConversionRate {
  base: string;
  target: string;
  mid: number;
  unit: number;
  timestamp: string;
}

interface ConversionResponse {
  status_code: number;
  data: ConversionRate;
}


export function useCurrencyConversion(
  sourceCurrency: Currency,
  targetCurrency: Currency = { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' }
) {
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  

  useEffect(() => {
    // Don't fetch if source and target are the same
    if (sourceCurrency.code === targetCurrency.code) {
      setConversionRate(1);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchConversionRate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://hexarate.paikama.co/api/rates/latest/${sourceCurrency.code}?target=${targetCurrency.code}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch conversion rate');
        }

        const data: ConversionResponse = await response.json();
        
        if (data.status_code === 200 && data.data) {
          setConversionRate(data.data.mid);
          setLastUpdated(data.data.timestamp);
        } else {
          throw new Error('Invalid response from conversion API');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Currency conversion error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversionRate();
  }, [sourceCurrency.code, targetCurrency.code]);

  const convertAmount = (amount: number): number => {
    if (!conversionRate || isNaN(amount)) return 0;
    return amount * conversionRate;
  };

  return {
    conversionRate,
    isLoading,
    error,
    lastUpdated,
    convertAmount,
  };
}
