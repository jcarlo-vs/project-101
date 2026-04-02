import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useBulkSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const startSelecting = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelecting(true);
    setSelectedIds(new Set([id]));
  }, []);

  const toggleItem = useCallback((id: string) => {
    if (!isSelecting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      next.add(id);
      return next;
    });
  }, [isSelecting]);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(new Set(ids));
  }, []);

  const clearAfterAction = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    isSelecting,
    selectedCount: selectedIds.size,
    startSelecting,
    toggleItem,
    cancelSelection,
    selectAll,
    clearAfterAction,
  };
}
