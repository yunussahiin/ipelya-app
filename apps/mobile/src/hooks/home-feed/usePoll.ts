/**
 * usePoll Hook
 * 
 * Amaç: Poll interactions - Anket oluşturma ve oy verme
 * 
 * Özellikler:
 * - useCreatePoll: Anket oluşturma
 * - useVotePoll: Oy verme
 * - Automatic cache invalidation
 * 
 * Kullanım:
 * const { createPoll } = useCreatePoll();
 * const { votePoll } = useVotePoll();
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPoll, votePoll } from '@ipelya/api/home-feed';
import type { CreatePollRequest, VotePollRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

/**
 * Create Poll Hook
 * Yeni anket oluşturma
 */
export function useCreatePoll() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: CreatePollRequest) =>
      createPoll(supabaseUrl, accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Vote Poll Hook
 * Ankete oy verme
 */
export function useVotePoll() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: VotePollRequest) =>
      votePoll(supabaseUrl, accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
