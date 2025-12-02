# Database Schema - Creator Gelir Sistemi

Bu döküman, creator gelir sistemi için gerekli veritabanı tablolarını ve ilişkilerini açıklar.

---

## 📊 ER Diagram

```
┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│    profiles     │      │ creator_transactions │      │   coin_rates     │
├─────────────────┤      ├─────────────────────┤      ├──────────────────┤
│ user_id (PK)    │◀────│ creator_id (FK)      │      │ id (PK)          │
│ ...             │      │ id (PK)             │      │ rate             │
└─────────────────┘      │ type                │      │ effective_from   │
         │               │ amount              │      │ created_by       │
         │               │ source_type         │      │ note             │
         │               │ source_id           │      └──────────────────┘
         │               │ rate_at_time        │
         │               │ ...                 │
         │               └─────────────────────┘
         │
         │               ┌─────────────────────┐      ┌──────────────────┐
         │               │   payment_methods   │      │  payout_requests │
         └──────────────▶├─────────────────────┤◀─────├──────────────────┤
                         │ id (PK)             │      │ id (PK)          │
                         │ creator_id (FK)     │      │ creator_id (FK)  │
                         │ type                │      │ method_id (FK)   │
                         │ status              │      │ coin_amount      │
                         │ bank_details        │      │ tl_amount        │
                         │ crypto_details      │      │ locked_rate      │
                         │ ...                 │      │ status           │
                         └─────────────────────┘      │ ...              │
                                                      └──────────────────┘
         │
         │               ┌─────────────────────┐
         └──────────────▶│   kyc_applications  │
                         ├─────────────────────┤
                         │ id (PK)             │
                         │ creator_id (FK)     │
                         │ level               │
                         │ status              │
                         │ personal_info       │
                         │ documents           │
                         │ verification_result │
                         │ ...                 │
                         └─────────────────────┘
```

---

## 📋 Tables

### 1. coin_rates (Coin/TL Kur Tablosu)

```sql
CREATE TABLE coin_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate DECIMAL(10, 4) NOT NULL,           -- 1 coin = X TL
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index: Güncel kuru hızlı bulmak için
CREATE INDEX idx_coin_rates_effective ON coin_rates(effective_from DESC);

-- RLS
ALTER TABLE coin_rates ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Anyone can read coin rates"
ON coin_rates FOR SELECT
USING (true);

-- Sadece admin yazabilir (service role ile)
CREATE POLICY "Only admins can insert coin rates"
ON coin_rates FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
);

-- Güncel kuru almak için view
CREATE VIEW current_coin_rate AS
SELECT rate, effective_from, created_at
FROM coin_rates
ORDER BY effective_from DESC
LIMIT 1;
```

### 2. creator_balances (Creator Bakiye Özeti)

```sql
CREATE TABLE creator_balances (
    creator_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    total_earned BIGINT DEFAULT 0,          -- Toplam kazanılan coin
    total_withdrawn BIGINT DEFAULT 0,       -- Toplam çekilen coin
    pending_payout BIGINT DEFAULT 0,        -- Bekleyen ödeme talebi
    available_balance BIGINT GENERATED ALWAYS AS (total_earned - total_withdrawn - pending_payout) STORED,
    last_transaction_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_creator_balances_available ON creator_balances(available_balance DESC);

-- RLS
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;

-- Creator kendi bakiyesini görebilir
CREATE POLICY "Creators can view own balance"
ON creator_balances FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Service role güncelleyebilir
CREATE POLICY "Service role can update balances"
ON creator_balances FOR ALL
TO service_role
USING (true);
```

### 3. creator_transactions (İşlem Geçmişi)

```sql
CREATE TYPE transaction_type AS ENUM (
    'subscription',     -- Abonelik geliri
    'gift',            -- Hediye geliri
    'ppv',             -- PPV geliri
    'payout',          -- Ödeme çıkışı
    'adjustment',      -- Manuel düzeltme
    'refund'           -- İade
);

CREATE TABLE creator_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount BIGINT NOT NULL,                  -- Pozitif = gelir, Negatif = çıkış
    
    -- Kaynak bilgisi
    source_type VARCHAR(50),                 -- 'subscription', 'gift', 'payout_request', vb.
    source_id UUID,                          -- İlgili kaydın ID'si
    
    -- Kur bilgisi (işlem anında)
    rate_at_time DECIMAL(10, 4),
    tl_equivalent DECIMAL(12, 2),
    
    -- Detay bilgileri
    description TEXT,
    metadata JSONB DEFAULT '{}',             -- Ek bilgiler
    
    -- Admin işlemleri için
    created_by UUID REFERENCES auth.users(id),
    adjustment_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_creator ON creator_transactions(creator_id, created_at DESC);
CREATE INDEX idx_transactions_type ON creator_transactions(type, created_at DESC);
CREATE INDEX idx_transactions_source ON creator_transactions(source_type, source_id);

-- RLS
ALTER TABLE creator_transactions ENABLE ROW LEVEL SECURITY;

-- Creator kendi işlemlerini görebilir
CREATE POLICY "Creators can view own transactions"
ON creator_transactions FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Insert service role ile
CREATE POLICY "Service role can insert transactions"
ON creator_transactions FOR INSERT
TO service_role
WITH CHECK (true);
```

### 4. payment_methods (Ödeme Yöntemleri)

```sql
CREATE TYPE payment_method_type AS ENUM ('bank', 'crypto');
CREATE TYPE payment_method_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE crypto_network AS ENUM ('TRC20', 'ERC20', 'BEP20');

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    type payment_method_type NOT NULL,
    status payment_method_status DEFAULT 'pending',
    is_default BOOLEAN DEFAULT false,
    
    -- Banka bilgileri (type = 'bank' ise)
    bank_name VARCHAR(100),
    bank_code VARCHAR(10),
    iban VARCHAR(34),
    account_holder VARCHAR(100),
    
    -- Kripto bilgileri (type = 'crypto' ise)
    crypto_network crypto_network,
    wallet_address VARCHAR(100),
    
    -- Onay/Red bilgileri
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_methods_creator ON payment_methods(creator_id, status);
CREATE INDEX idx_payment_methods_status ON payment_methods(status, created_at DESC);

-- Unique constraint: Bir creator'ın aynı IBAN veya wallet adresi olmamalı
CREATE UNIQUE INDEX idx_payment_methods_iban ON payment_methods(iban) WHERE iban IS NOT NULL;
CREATE UNIQUE INDEX idx_payment_methods_wallet ON payment_methods(wallet_address) WHERE wallet_address IS NOT NULL;

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Creator kendi yöntemlerini görebilir
CREATE POLICY "Creators can view own payment methods"
ON payment_methods FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Creator yeni yöntem ekleyebilir
CREATE POLICY "Creators can add payment methods"
ON payment_methods FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Creator kendi yöntemini güncelleyebilir (sadece pending durumda)
CREATE POLICY "Creators can update pending payment methods"
ON payment_methods FOR UPDATE
TO authenticated
USING (creator_id = auth.uid() AND status = 'pending');

-- Creator kendi yöntemini silebilir
CREATE POLICY "Creators can delete own payment methods"
ON payment_methods FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- Varsayılan yöntem trigger'ı
CREATE OR REPLACE FUNCTION set_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE payment_methods 
        SET is_default = false 
        WHERE creator_id = NEW.creator_id 
        AND id != NEW.id 
        AND type = NEW.type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_default_payment_method
BEFORE INSERT OR UPDATE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION set_default_payment_method();
```

### 5. payout_requests (Ödeme Talepleri)

```sql
CREATE TYPE payout_status AS ENUM (
    'pending',      -- Beklemede
    'in_review',    -- İnceleniyor
    'approved',     -- Onaylandı
    'paid',         -- Ödendi
    'rejected',     -- Reddedildi
    'cancelled'     -- İptal edildi
);

CREATE TABLE payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    
    -- Miktar bilgileri
    coin_amount BIGINT NOT NULL,
    tl_amount DECIMAL(12, 2) NOT NULL,
    locked_rate DECIMAL(10, 4) NOT NULL,    -- Kilitlenmiş kur
    rate_locked_at TIMESTAMPTZ NOT NULL,
    
    -- Durum
    status payout_status DEFAULT 'pending',
    
    -- Onay/Red bilgileri
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Ödeme bilgileri
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),         -- Banka dekont no, tx hash vb.
    
    -- Internal
    internal_notes TEXT,                    -- Admin notları (creator görmez)
    is_auto_created BOOLEAN DEFAULT false,  -- Otomatik ödeme ile mi oluşturuldu
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payout_requests_creator ON payout_requests(creator_id, created_at DESC);
CREATE INDEX idx_payout_requests_status ON payout_requests(status, created_at DESC);

-- RLS
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Creator kendi taleplerini görebilir
CREATE POLICY "Creators can view own payout requests"
ON payout_requests FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Creator yeni talep oluşturabilir
CREATE POLICY "Creators can create payout requests"
ON payout_requests FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Creator pending talebi iptal edebilir
CREATE POLICY "Creators can cancel pending requests"
ON payout_requests FOR UPDATE
TO authenticated
USING (creator_id = auth.uid() AND status = 'pending')
WITH CHECK (status = 'cancelled');
```

### 6. payout_status_history (Durum Geçmişi)

```sql
CREATE TABLE payout_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_request_id UUID NOT NULL REFERENCES payout_requests(id) ON DELETE CASCADE,
    status payout_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payout_status_history_request ON payout_status_history(payout_request_id, created_at DESC);

-- RLS
ALTER TABLE payout_status_history ENABLE ROW LEVEL SECURITY;

-- Creator kendi taleplerinin geçmişini görebilir
CREATE POLICY "Creators can view own payout status history"
ON payout_status_history FOR SELECT
TO authenticated
USING (
    payout_request_id IN (
        SELECT id FROM payout_requests WHERE creator_id = auth.uid()
    )
);

-- Trigger: Her durum değişikliğinde geçmişe kaydet
CREATE OR REPLACE FUNCTION log_payout_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payout_status_history (payout_request_id, status, changed_by)
        VALUES (NEW.id, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_payout_status_change
AFTER UPDATE ON payout_requests
FOR EACH ROW EXECUTE FUNCTION log_payout_status_change();
```

### 7. auto_payout_settings (Otomatik Ödeme Ayarları)

```sql
CREATE TABLE auto_payout_settings (
    creator_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    minimum_coin_amount BIGINT DEFAULT 1000,
    payment_method_id UUID REFERENCES payment_methods(id),
    day_of_week SMALLINT DEFAULT 1,         -- 1 = Pazartesi, 7 = Pazar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE auto_payout_settings ENABLE ROW LEVEL SECURITY;

-- Creator kendi ayarlarını görebilir ve değiştirebilir
CREATE POLICY "Creators can manage own auto payout settings"
ON auto_payout_settings FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());
```

### 8. kyc_applications (KYC Başvuruları)

```sql
CREATE TYPE kyc_level AS ENUM ('basic', 'full');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE kyc_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    level kyc_level NOT NULL,
    status kyc_status DEFAULT 'pending',
    
    -- Kişisel bilgiler (şifrelenmiş saklanabilir)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    id_number VARCHAR(20),                  -- TC Kimlik No (encrypted)
    
    -- Belgeler (Storage path'leri)
    id_front_path TEXT NOT NULL,
    id_back_path TEXT NOT NULL,
    selfie_path TEXT NOT NULL,
    liveness_frames TEXT[],                 -- Ek liveness kareleri
    
    -- Otomatik doğrulama sonuçları
    verification_result JSONB,
    auto_score DECIMAL(4, 2),               -- 0.00 - 1.00
    auto_recommendation VARCHAR(20),         -- auto_approve, manual_review, auto_reject
    
    -- İnceleme bilgileri
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kyc_applications_creator ON kyc_applications(creator_id, created_at DESC);
CREATE INDEX idx_kyc_applications_status ON kyc_applications(status, created_at DESC);

-- RLS
ALTER TABLE kyc_applications ENABLE ROW LEVEL SECURITY;

-- Creator kendi başvurularını görebilir
CREATE POLICY "Creators can view own kyc applications"
ON kyc_applications FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Creator yeni başvuru yapabilir
CREATE POLICY "Creators can submit kyc applications"
ON kyc_applications FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());
```

### 9. creator_kyc_profiles (KYC Profil Özeti)

```sql
CREATE TABLE creator_kyc_profiles (
    creator_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    level kyc_level,
    status kyc_status DEFAULT 'pending',
    verified_name VARCHAR(200),
    monthly_payout_limit DECIMAL(12, 2) DEFAULT 10000,  -- TL cinsinden
    last_application_id UUID REFERENCES kyc_applications(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE creator_kyc_profiles ENABLE ROW LEVEL SECURITY;

-- Creator kendi profilini görebilir
CREATE POLICY "Creators can view own kyc profile"
ON creator_kyc_profiles FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Trigger: KYC onaylandığında profili güncelle
CREATE OR REPLACE FUNCTION update_kyc_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        INSERT INTO creator_kyc_profiles (
            creator_id, level, status, verified_name, 
            monthly_payout_limit, last_application_id, verified_at
        )
        VALUES (
            NEW.creator_id, NEW.level, 'approved',
            CONCAT(NEW.first_name, ' ', NEW.last_name),
            CASE WHEN NEW.level = 'basic' THEN 10000 ELSE 999999999 END,
            NEW.id, NOW()
        )
        ON CONFLICT (creator_id) DO UPDATE SET
            level = EXCLUDED.level,
            status = EXCLUDED.status,
            verified_name = EXCLUDED.verified_name,
            monthly_payout_limit = EXCLUDED.monthly_payout_limit,
            last_application_id = EXCLUDED.last_application_id,
            verified_at = EXCLUDED.verified_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_kyc_approval
AFTER UPDATE ON kyc_applications
FOR EACH ROW 
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved')
EXECUTE FUNCTION update_kyc_profile_on_approval();
```

---

## 🔄 Realtime Publications

```sql
-- Realtime için tabloları ekle
ALTER PUBLICATION supabase_realtime ADD TABLE creator_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payout_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE creator_balances;

-- REPLICA IDENTITY
ALTER TABLE creator_transactions REPLICA IDENTITY FULL;
ALTER TABLE payout_requests REPLICA IDENTITY FULL;
ALTER TABLE payment_methods REPLICA IDENTITY FULL;
ALTER TABLE creator_balances REPLICA IDENTITY FULL;
```

---

## 📊 Database Functions

### Güncel Kuru Al

```sql
CREATE OR REPLACE FUNCTION get_current_coin_rate()
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT rate 
        FROM coin_rates 
        ORDER BY effective_from DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

### Creator Bakiyesini Güncelle

```sql
CREATE OR REPLACE FUNCTION update_creator_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.amount > 0 THEN
            -- Gelir
            UPDATE creator_balances 
            SET total_earned = total_earned + NEW.amount,
                last_transaction_at = NOW(),
                updated_at = NOW()
            WHERE creator_id = NEW.creator_id;
        ELSE
            -- Çıkış (payout)
            UPDATE creator_balances 
            SET total_withdrawn = total_withdrawn + ABS(NEW.amount),
                last_transaction_at = NOW(),
                updated_at = NOW()
            WHERE creator_id = NEW.creator_id;
        END IF;
        
        -- Bakiye kaydı yoksa oluştur
        INSERT INTO creator_balances (creator_id, total_earned, total_withdrawn)
        VALUES (NEW.creator_id, 
                CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
                CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END)
        ON CONFLICT (creator_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_balance
AFTER INSERT ON creator_transactions
FOR EACH ROW EXECUTE FUNCTION update_creator_balance();
```

### Ödeme Talebi Oluşturma

```sql
CREATE OR REPLACE FUNCTION create_payout_request(
    p_creator_id UUID,
    p_coin_amount BIGINT,
    p_payment_method_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_available_balance BIGINT;
    v_current_rate DECIMAL;
    v_tl_amount DECIMAL;
    v_request_id UUID;
BEGIN
    -- Mevcut bakiyeyi kontrol et
    SELECT available_balance INTO v_available_balance
    FROM creator_balances
    WHERE creator_id = p_creator_id;
    
    IF v_available_balance < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Minimum kontrol
    IF p_coin_amount < 500 THEN
        RAISE EXCEPTION 'Minimum payout is 500 coins';
    END IF;
    
    -- Güncel kuru al
    v_current_rate := get_current_coin_rate();
    v_tl_amount := p_coin_amount * v_current_rate;
    
    -- Talebi oluştur
    INSERT INTO payout_requests (
        creator_id, payment_method_id, coin_amount, 
        tl_amount, locked_rate, rate_locked_at
    )
    VALUES (
        p_creator_id, p_payment_method_id, p_coin_amount,
        v_tl_amount, v_current_rate, NOW()
    )
    RETURNING id INTO v_request_id;
    
    -- Bekleyen bakiyeyi güncelle
    UPDATE creator_balances
    SET pending_payout = pending_payout + p_coin_amount,
        updated_at = NOW()
    WHERE creator_id = p_creator_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Migration Checklist

- [ ] coin_rates tablosu
- [ ] creator_balances tablosu
- [ ] creator_transactions tablosu
- [ ] payment_methods tablosu
- [ ] payout_requests tablosu
- [ ] payout_status_history tablosu
- [ ] auto_payout_settings tablosu
- [ ] kyc_applications tablosu
- [ ] creator_kyc_profiles tablosu
- [ ] Tüm RLS policies
- [ ] Tüm triggers
- [ ] Tüm functions
- [ ] Realtime publications
- [ ] Indexes
