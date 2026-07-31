import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

export function usePipeline() {
  return useMutation({
    mutationFn: ({ connectionId, userQuery }: { connectionId: number; userQuery: string }) =>
      api.askPipeline(connectionId, userQuery),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.exportReport>[0]) => api.exportReport(data),
  });
}
