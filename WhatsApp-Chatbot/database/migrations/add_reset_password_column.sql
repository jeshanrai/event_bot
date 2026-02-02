ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN reset_password_expire TIMESTAMP DEFAULT NULL;

CREATE INDEX idx_reset_token ON users(reset_password_token);

ALTER TABLE users 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
