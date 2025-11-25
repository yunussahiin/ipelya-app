-- Add is_verified field for verified accounts
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add location field
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location text;

-- Add cover_url field for profile cover images
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cover_url text;

-- Add website field
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website text;

-- Add comments
COMMENT ON COLUMN profiles.is_verified IS 'Doğrulanmış hesap durumu';

COMMENT ON COLUMN profiles.location IS 'Kullanıcı lokasyonu';

COMMENT ON COLUMN profiles.cover_url IS 'Profil kapak fotoğrafı URL';

COMMENT ON COLUMN profiles.website IS 'Kullanıcı web sitesi';