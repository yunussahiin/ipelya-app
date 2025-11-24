/**
 * useIntent Hook
 * 
 * Amaç: Intent (dating intention) management
 * 
 * Özellikler:
 * - updateIntent: Intent güncelleme
 * - Multiple intent support
 * - Priority-based
 * 
 * Kullanım:
 * const { updateIntent } = useUpdateIntent();
 * await updateIntent.mutateAsync({ intents: [...] });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateIntent } from '@ipelya/api/home-feed';
import type { UpdateIntentRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

/**
 * Update Intent Hook
 * Dating intent güncelleme
 */
export function useUpdateIntent() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: UpdateIntentRequest) =>
      updateIntent(supabaseUrl, accessToken, data),
    onSuccess: () => {
      // Feed'i refresh et (intent değişti)
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['intent'] });
    },
  });
}
