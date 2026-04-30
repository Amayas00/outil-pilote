import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '../services/api'

export function useJoursFeries(params = {}) {
  return useQuery({
    queryKey: ['jours-feries', params],
    queryFn: () => calendarService.getJoursFeries(params).then(r => r.data?.results ?? r.data ?? []),
    keepPreviousData: true,
  })
}

export function useCreateJourFerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => calendarService.createJourFerie(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jours-feries'] }),
  })
}

export function useUpdateJourFerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => calendarService.updateJourFerie(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jours-feries'] }),
  })
}

export function useDeleteJourFerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => calendarService.deleteJourFerie(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jours-feries'] }),
  })
}
