/**
 * useSocial Hook
 * 
 * Amaç: Social interactions - Suggestions, gifts, vb.
 * 
 * Özellikler:
 * - useSuggestions: Profil önerileri
 * - useSendGift: Dijital hediye gönderme
 * 
 * Kullanım:
 * const { data: suggestions } = useSuggestions();
 * const { sendGift } = useSendGift();
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuggestions, sendCrystalGift } from '@ipelya/api/home-feed';
import type { SendGiftRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

/**
 * Suggestions Hook
 * Profil önerileri getir
 */
export function useSuggestions(params?: { limit?: number }) {
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useQuery({
    queryKey: ['suggestions', params],
    queryFn: async () => {
      const response = await getSuggestions(supabaseUrl, accessToken, params);
      
      if (!response.success) {
        throw new Error(response.error || 'Suggestions fetch failed');
      }
      
      return response.data?.profiles || [];
    },
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Send Gift Hook
 * Dijital hediye gönderme
 */
export function useSendGift() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: SendGiftRequest) =>
      sendCrystalGift(supabaseUrl, accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    },
  });
}
