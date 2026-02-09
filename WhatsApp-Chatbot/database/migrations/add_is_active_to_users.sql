-- Add is_active column for soft delete functionality
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;
