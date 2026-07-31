import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export function useSchema(connectionId: number | null) {
  return useQuery({
    queryKey: ['schema', connectionId],
    queryFn: () => api.getSchema(connectionId!),
    enabled: connectionId !== null,
    staleTime: 5 * 60_000,
  });
}

export function useSyncSchema(connectionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.syncSchema(connectionId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schema', connectionId] });
      toast.success('Schema synced successfully');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
