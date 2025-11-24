/**
 * useVibe Hook
 * 
 * Amaç: Vibe (mood) management - Kullanıcı mood durumunu yönetir
 * 
 * Özellikler:
 * - updateVibe: Mood güncelleme
 * - getCurrentVibe: Mevcut mood'u getir
 * - Automatic feed refresh (mood değişince)
 * 
 * Kullanım:
 * const { updateVibe, currentVibe } = useVibe();
 * await updateVibe.mutateAsync({ vibe_type: 'energetic', intensity: 4 });
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateVibe } from '@ipelya/api/home-feed';
import type { UpdateVibeRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

/**
 * Update Vibe Hook
 * Mood güncelleme
 */
export function useUpdateVibe() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: UpdateVibeRequest) =>
      updateVibe(supabaseUrl, accessToken, data),
    onSuccess: () => {
      // Feed'i refresh et (mood değişti, yeni içerikler gelecek)
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['vibe'] });
    },
  });
}

/**
 * Get Current Vibe Hook
 * Mevcut mood'u getir (placeholder - API endpoint gerekli)
 */
export function useCurrentVibe() {
  const { session } = useAuthStore();
  
  return useQuery({
    queryKey: ['vibe', session?.user?.id],
    queryFn: async () => {
      // TODO: API endpoint eklenecek (get-current-vibe)
      return null;
    },
    enabled: !!session?.user?.id,
  });
}
