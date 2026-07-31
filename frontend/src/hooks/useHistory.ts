import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useHistory(connectionId?: number, skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['history', connectionId, skip, limit],
    queryFn: () => api.getHistory(connectionId, skip, limit),
    staleTime: 30_000,
  });
}

export function useHistoryStats() {
  return useQuery({
    queryKey: ['history-stats'],
    queryFn: () => api.getHistoryStats(),
    staleTime: 30_000,
  });
}

export function useHistoryDetail(id: number | null) {
  return useQuery({
    queryKey: ['history-detail', id],
    queryFn: () => api.getHistoryDetail(id!),
    enabled: id !== null,
  });
}
