import { useState, useEffect } from 'react';
import { Fund, User } from '@/types';
import { getUserFunds } from '@/firebase/fundService';
import { toast } from 'sonner';

interface DashboardData {
  funds: Fund[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = (currentUser: User | null) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    funds: [],
    isLoading: false,
    error: null
  });

  const loadUserFunds = async (userId: string) => {
    if (!userId) return;
    
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));
      const userFunds = await getUserFunds(userId);
      
      // Prevent duplicates by using a Map with fund IDs as keys
      const uniqueFundsMap = new Map();
      
      // Add the newly fetched funds
      userFunds.forEach(fund => uniqueFundsMap.set(fund.id, fund));
      
      // Convert map back to array
      const uniqueFunds = Array.from(uniqueFundsMap.values());
      
      // Update state with deduplicated funds
      setDashboardData(prev => ({
        ...prev,
        funds: uniqueFunds,
        isLoading: false,
        error: null
      }));
      
      console.log(`Dashboard: Loaded ${userFunds.length} funds, deduplicated to ${uniqueFunds.length}`);
    } catch (error) {
      console.error('Dashboard: Error loading funds:', error);
      const errorMessage = 'Không thể tải danh sách quỹ';
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  };

  const refreshFunds = async () => {
    if (currentUser?.id) {
      await loadUserFunds(currentUser.id);
    }
  };

  // Load funds when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadUserFunds(currentUser.id);
    } else {
      // Clear funds when no user
      setDashboardData({
        funds: [],
        isLoading: false,
        error: null
      });
    }
  }, [currentUser?.id]);

  return {
    funds: dashboardData.funds,
    isLoading: dashboardData.isLoading,
    error: dashboardData.error,
    refreshFunds,
    loadUserFunds
  };
};
