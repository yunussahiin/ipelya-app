# Creator Gelir Raporu - Mobile Implementation

Bu döküman, creator gelir raporu ekranının detaylı tasarımını ve implementasyonunu açıklar.

---

## 📊 Genel Bakış

Gelir raporu ekranı, creator'ların kazançlarını detaylı şekilde görüntülemesini sağlar.

### Mevcut Durum vs Hedef

| Özellik        | Mevcut  | Hedef                  |
| -------------- | ------- | ---------------------- |
| Toplam kazanç  | ✅       | ✅ + TL karşılığı       |
| Zaman filtresi | ✅       | ✅ (değişiklik yok)     |
| Gelir dağılımı | ✅ Basit | ✅ Tier bazlı breakdown |
| Trend grafiği  | ❌       | ✅ Mini chart           |
| İşlem geçmişi  | ❌       | ✅ Detaylı liste        |
| Coin/TL kuru   | ❌       | ✅ Bottom sheet         |

---

## 🎨 UI Tasarımı

### 1. Üst Özet Kartı

```
┌─────────────────────────────────────────────┐
│                                             │
│           Toplam Kazanç                     │
│                                             │
│        🪙  12,450                           │
│                                             │
│      ≈ ₺6,225  ⓘ                           │
│      ↑ tıklanınca kur detayı                │
│                                             │
└─────────────────────────────────────────────┘
```

**Kur Detayı Bottom Sheet:**

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  💱 Coin/TL Dönüşüm Oranı                   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  1 Coin = ₺0.50                     │    │
│  │  Son güncelleme: 03 Aralık 2025     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ℹ️ Bu oran sadece bilgilendirme             │
│  amaçlıdır. Gerçek ödeme tutarı,           │
│  ödeme talebi oluşturulduğunda             │
│  geçerli kur üzerinden hesaplanır.         │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Zaman Filtresi

Mevcut butonlar korunuyor:

```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│Hafta│ │ Ay  │ │3 Ay │ │6 Ay │ │1 Yıl│ │Tümü │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
    ▲ seçili
```

### 3. Gelir Dağılımı (Genişletilmiş)

```
┌─────────────────────────────────────────────┐
│  Gelir Dağılımı                             │
├─────────────────────────────────────────────┤
│                                             │
│  ● Abonelikler                    🪙 8,200  │
│    ≈ ₺4,100                              >  │
│    ↑ tıkla → tier breakdown                 │
│                                             │
│  ● Hediyeler                      🪙 4,250  │
│    ≈ ₺2,125                                 │
│                                             │
│  ─────────────────────────────────────────  │
│  Toplam                          🪙 12,450  │
│                                             │
└─────────────────────────────────────────────┘
```

**Tier Breakdown Sheet:**

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  Abonelik Gelirleri (Tier Bazlı)            │
│                                             │
│  🥉 Bronze                                  │
│     45 abone × 50 coin = 🪙 2,250           │
│                                             │
│  🥈 Silver                                  │
│     23 abone × 150 coin = 🪙 3,450          │
│                                             │
│  🥇 Gold                                    │
│     8 abone × 300 coin = 🪙 2,400           │
│                                             │
│  💎 Diamond                                 │
│     1 abone × 500 coin = 🪙 500             │
│                                             │
│  ─────────────────────────────────────────  │
│  Toplam: 🪙 8,600 (≈ ₺4,300)                │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. Trend Grafiği

```
┌─────────────────────────────────────────────┐
│  📈 Kazanç Trendi                           │
├─────────────────────────────────────────────┤
│                                             │
│   🪙 2,500 ┤                    ╭───        │
│            │              ╭────╯            │
│   🪙 2,000 ┤        ╭────╯                  │
│            │  ╭────╯                        │
│   🪙 1,500 ┤──╯                             │
│            │                                │
│   🪙 1,000 ┼────┬────┬────┬────┬────┬────   │
│            Pzt  Sal  Çar  Per  Cum  Cmt     │
│                                             │
│  🔥 En iyi gün: Cuma (🪙 2,450)             │
│                                             │
└─────────────────────────────────────────────┘
```

### 5. İşlem Geçmişi

```
┌─────────────────────────────────────────────┐
│  İşlem Geçmişi                              │
│                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ Tümü  │ │Abone. │ │Hediye │ │Ödeme  │    │
│  └───────┘ └───────┘ └───────┘ └───────┘    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  👑 Abonelik – Gold Tier      +300 coin     │
│     @username • 2 saat önce    ≈ ₺150       │
│                                             │
│  🎁 Hediye – Süper Kalp       +50 coin      │
│     @fan_user • 5 saat önce    ≈ ₺25        │
│                                             │
│  🥈 Abonelik – Silver Tier    +150 coin     │
│     @newuser • dün             ≈ ₺75        │
│                                             │
│  💸 Ödeme Çıkışı              -5,000 coin   │
│     Banka • 28 Kasım           ≈ ₺2,500     │
│                                             │
│  [Daha Fazla Yükle]                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Hook Implementation

### useCreatorEarnings (Geliştirilmiş)

```typescript
/**
 * useCreatorEarnings Hook - Genişletilmiş versiyon
 * 
 * Özellikler:
 * - Toplam kazanç (coin + TL)
 * - Tier bazlı breakdown
 * - Günlük trend data
 * - İşlem geçmişi
 * - Coin/TL kur bilgisi
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export type EarningsPeriod = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';
export type TransactionType = 'all' | 'subscription' | 'gift' | 'payout';

export interface CoinRate {
  rate: number;           // 1 coin = X TL
  updatedAt: string;
  isLocked: boolean;      // Ödeme talebinde kilitlenmiş mi
}

export interface TierEarning {
  tierId: string;
  tierName: string;
  tierEmoji: string;
  subscriberCount: number;
  coinPerSubscriber: number;
  totalCoins: number;
}

export interface DailyTrend {
  date: string;
  coins: number;
  label: string;  // "Pzt", "Sal" vs.
}

export interface Transaction {
  id: string;
  type: 'subscription' | 'gift' | 'payout' | 'adjustment';
  amount: number;         // Pozitif = gelir, Negatif = çıkış
  description: string;
  fromUser?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  tierName?: string;
  giftName?: string;
  createdAt: string;
}

export interface EarningsData {
  // Özet
  totalCoins: number;
  totalTL: number;
  
  // Dağılım
  subscriptionCoins: number;
  giftCoins: number;
  
  // Tier breakdown
  tierBreakdown: TierEarning[];
  
  // Trend (son 7 gün veya seçili periyoda göre)
  dailyTrend: DailyTrend[];
  bestDay: DailyTrend | null;
  
  // İşlemler
  transactions: Transaction[];
  hasMoreTransactions: boolean;
  
  // Kur bilgisi
  coinRate: CoinRate;
}

export function useCreatorEarnings() {
  const [period, setPeriod] = useState<EarningsPeriod>('30d');
  const [transactionFilter, setTransactionFilter] = useState<TransactionType>('all');
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadEarnings = useCallback(async (resetTransactions = true) => {
    setIsLoading(true);
    if (resetTransactions) setTransactionPage(1);

    try {
      const { data: result, error } = await supabase.functions.invoke('get-creator-earnings', {
        body: { 
          period,
          transactionFilter,
          transactionPage: resetTransactions ? 1 : transactionPage,
          transactionLimit: 20
        }
      });

      if (error) throw error;

      setData(result);
    } catch (err) {
      console.error('Load earnings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, transactionFilter, transactionPage]);

  // Daha fazla işlem yükle
  const loadMoreTransactions = useCallback(async () => {
    if (!data?.hasMoreTransactions || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = transactionPage + 1;

    try {
      const { data: result, error } = await supabase.functions.invoke('get-creator-earnings', {
        body: { 
          period,
          transactionFilter,
          transactionPage: nextPage,
          transactionLimit: 20,
          transactionsOnly: true
        }
      });

      if (error) throw error;

      setData(prev => prev ? {
        ...prev,
        transactions: [...prev.transactions, ...result.transactions],
        hasMoreTransactions: result.hasMoreTransactions
      } : null);

      setTransactionPage(nextPage);
    } catch (err) {
      console.error('Load more transactions error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [data, isLoadingMore, period, transactionFilter, transactionPage]);

  // Period değişince yeniden yükle
  useEffect(() => {
    loadEarnings(true);
  }, [period, transactionFilter]);

  // Realtime subscription
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel(`creator-earnings-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'creator_transactions',
            filter: `creator_id=eq.${session.user.id}`
          },
          () => {
            console.log('[useCreatorEarnings] New transaction, refreshing...');
            loadEarnings(false);
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadEarnings]);

  // Coin'i TL'ye çevir
  const coinsToTL = useCallback((coins: number): number => {
    if (!data?.coinRate) return coins * 0.5; // Fallback
    return coins * data.coinRate.rate;
  }, [data?.coinRate]);

  return {
    data,
    isLoading,
    isLoadingMore,
    period,
    transactionFilter,
    changePeriod: setPeriod,
    changeTransactionFilter: setTransactionFilter,
    loadMoreTransactions,
    refresh: () => loadEarnings(true),
    coinsToTL,
  };
}
```

---

## 📱 Component Yapısı

### Dosya Organizasyonu

```
/apps/mobile/src/
├── app/(creator)/
│   └── earnings.tsx              # Ana ekran (güncellenecek)
├── components/creator/earnings/
│   ├── index.ts
│   ├── EarningsSummaryCard.tsx   # Üst özet kartı
│   ├── CoinRateSheet.tsx         # Kur detay sheet
│   ├── EarningsBreakdown.tsx     # Gelir dağılımı
│   ├── TierBreakdownSheet.tsx    # Tier detay sheet
│   ├── EarningsTrendChart.tsx    # Mini trend grafiği
│   ├── TransactionList.tsx       # İşlem listesi
│   ├── TransactionItem.tsx       # Tek işlem satırı
│   └── TransactionFilters.tsx    # Filtre butonları
└── hooks/
    └── useCreatorEarnings.ts     # Güncellenecek
```

### EarningsSummaryCard Component

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { CoinRateSheet } from './CoinRateSheet';

interface EarningsSummaryCardProps {
  totalCoins: number;
  totalTL: number;
  coinRate: {
    rate: number;
    updatedAt: string;
  };
  isLoading?: boolean;
}

export function EarningsSummaryCard({
  totalCoins,
  totalTL,
  coinRate,
  isLoading
}: EarningsSummaryCardProps) {
  const { colors } = useTheme();
  const [showRateSheet, setShowRateSheet] = useState(false);

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.accent }]}>
        <Text style={styles.label}>Toplam Kazanç</Text>
        
        <View style={styles.coinRow}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinValue}>
            {isLoading ? '...' : totalCoins.toLocaleString('tr-TR')}
          </Text>
        </View>

        <Pressable 
          style={styles.tlRow}
          onPress={() => setShowRateSheet(true)}
        >
          <Text style={styles.tlValue}>
            ≈ ₺{isLoading ? '...' : totalTL.toLocaleString('tr-TR')}
          </Text>
          <Info size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <CoinRateSheet
        visible={showRateSheet}
        onClose={() => setShowRateSheet(false)}
        rate={coinRate.rate}
        updatedAt={coinRate.updatedAt}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinIcon: {
    fontSize: 32,
  },
  coinValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tlValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
```

---

## 📊 Trend Grafiği için Kütüphane

Önerilen: `react-native-svg` + `victory-native` veya `react-native-chart-kit`

### Basit Line Chart Component

```typescript
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/theme/ThemeProvider';

interface EarningsTrendChartProps {
  data: { date: string; coins: number; label: string }[];
  bestDay: { date: string; coins: number; label: string } | null;
}

export function EarningsTrendChart({ data, bestDay }: EarningsTrendChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.coins),
      strokeWidth: 2,
    }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        📈 Kazanç Trendi
      </Text>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: () => colors.accent,
          labelColor: () => colors.textSecondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.accent,
          },
        }}
        bezier
        style={styles.chart}
      />

      {bestDay && (
        <View style={[styles.bestDay, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.bestDayText, { color: colors.accent }]}>
            🔥 En iyi gün: {bestDay.label} (🪙 {bestDay.coins.toLocaleString()})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  bestDay: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  bestDayText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
```

---

## ✅ Checklist

### Mobile Implementation

- [ ] `useCreatorEarnings` hook güncelle
- [ ] `EarningsSummaryCard` component oluştur
- [ ] `CoinRateSheet` bottom sheet oluştur
- [ ] `EarningsBreakdown` component oluştur
- [ ] `TierBreakdownSheet` bottom sheet oluştur
- [ ] `EarningsTrendChart` component oluştur (chart library ekle)
- [ ] `TransactionList` component oluştur
- [ ] `TransactionItem` component oluştur
- [ ] `TransactionFilters` component oluştur
- [ ] Ana `earnings.tsx` ekranı güncelle
- [ ] Realtime subscription ekle

### Backend (Edge Functions)

- [ ] `get-creator-earnings` edge function güncelle
- [ ] Tier breakdown query ekle
- [ ] Günlük trend aggregation ekle
- [ ] Transaction pagination ekle
- [ ] Coin rate bilgisi döndür

### Database

- [ ] `creator_transactions` tablosu (varsa kontrol et)
- [ ] `coin_rates` tablosu
- [ ] Gerekli indexler
