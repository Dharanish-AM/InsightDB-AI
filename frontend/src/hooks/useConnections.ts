import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { DatabaseConnection } from '../types';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => api.getConnections(),
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DatabaseConnection, 'id' | 'is_active' | 'created_at'> & { password: string }) =>
      api.createConnection(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['connections'] }); toast.success('Connection created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateConnection>[1] }) =>
      api.updateConnection(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['connections'] }); toast.success('Connection updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteConnection(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['connections'] }); toast.success('Connection deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.testConnection>[0]) => api.testConnection(data),
  });
}
