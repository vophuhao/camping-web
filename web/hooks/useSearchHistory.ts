import { useState, useCallback } from 'react';

interface UseSearchHistoryOptions {
  storageKey: string;
  maxHistory?: number;
}

/**
 * Hook quản lý lịch sử tìm kiếm trong localStorage
 * @param storageKey - Key để lưu trong localStorage (e.g., 'global_search_history')
 * @param maxHistory - Số lượng tối đa lịch sử (mặc định: 10)
 */
export function useSearchHistory({ storageKey, maxHistory = 10 }: UseSearchHistoryOptions) {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addHistory = useCallback((term: string) => {
    if (!term || !term.trim()) return;
    
    const trimmedTerm = term.trim();
    setHistory(prev => {
      // Loại bỏ term trùng lặp và đặt lên đầu, giới hạn số lượng
      const newHistory = [
        trimmedTerm,
        ...prev.filter(item => item.toLowerCase() !== trimmedTerm.toLowerCase())
      ].slice(0, maxHistory);
      
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [storageKey, maxHistory]);

  const removeHistory = useCallback((term: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== term);
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [storageKey]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    history,
    addHistory,
    removeHistory,
    clearHistory,
  };
}