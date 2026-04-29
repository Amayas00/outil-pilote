import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsService } from '../services/api'

export function useCollaborateurs(params = {}) {
  return useQuery({
    queryKey: ['collaborateurs', params],
    queryFn: () => teamsService.getCollabs(params).then(r => r.data?.results ?? r.data ?? []),
    keepPreviousData: true,
  })
}

export function useCollaborateur(id) {
  return useQuery({
    queryKey: ['collaborateurs', id],
    queryFn: () => teamsService.getCollab(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateCollaborateur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => teamsService.createCollab(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborateurs'] }),
  })
}

export function useUpdateCollaborateur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => teamsService.updateCollab(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborateurs'] }),
  })
}

export function useChangerEquipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => teamsService.changerEquipe(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborateurs'] }),
  })
}
