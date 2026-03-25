import { useQuery } from '@tanstack/react-query';
import { api, shareApi, FileNode, NoteData, GraphData, SharedWithMeData } from '../lib/api';

// Notes tree
export function useNotesTree(userId?: string) {
  return useQuery<FileNode[]>({
    queryKey: ['notes', 'tree', userId],
    queryFn: () => api.getNotes(),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// Single note
export function useNoteQuery(path: string | null) {
  return useQuery<NoteData>({
    queryKey: ['notes', 'note', path],
    queryFn: () => api.getNote(path!),
    enabled: !!path,
  });
}

// Graph data
export function useGraphQuery(userId?: string, treeKey?: number) {
  return useQuery<GraphData>({
    queryKey: ['graph', userId, treeKey],
    queryFn: () => api.getGraph(),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// Starred notes
export function useStarredNotes(userId?: string) {
  return useQuery<Set<string>>({
    queryKey: ['settings', 'starred', userId],
    queryFn: async () => {
      const settings = await api.getSettings();
      if (settings.starred) {
        try {
          const paths = JSON.parse(settings.starred) as string[];
          return new Set(paths);
        } catch {
          return new Set<string>();
        }
      }
      return new Set<string>();
    },
    enabled: !!userId,
  });
}

// Shared notes
export function useSharedNotes(userId?: string) {
  return useQuery<SharedWithMeData[]>({
    queryKey: ['shares', 'withMe', userId],
    queryFn: () => shareApi.withMe(),
    enabled: !!userId,
  });
}

