import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsService } from '../services/api'
import api from '../services/api'

export function useEquipes(params = {}) {
  return useQuery({
    queryKey: ['equipes', params],
    queryFn: () => teamsService.getEquipes(params).then(r => r.data?.results ?? r.data ?? []),
    keepPreviousData: true,
  })
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => teamsService.getRegions().then(r => r.data?.results ?? r.data ?? []),
    staleTime: Infinity,
  })
}

export function useDomaines() {
  return useQuery({
    queryKey: ['domaines'],
    queryFn: () => api.get('/domaines/').then(r => r.data?.results ?? r.data ?? []),
    staleTime: Infinity,
  })
}

export function useCreateEquipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/equipes/', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useUpdateEquipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/equipes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useDeactivateEquipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.patch(`/equipes/${id}/`, { active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipes'] }),
  })
}
