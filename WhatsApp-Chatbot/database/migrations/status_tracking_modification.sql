-- ================================================
-- ORDER STATUS TRACKING & NOTIFICATIONS
-- Enhancement: Real-time order status updates
-- ================================================

-- Add new columns to orders table for status tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'created',
ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_ready_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS queue_position INTEGER,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS notified_ready BOOLEAN DEFAULT false;

-- Create order status enum values
-- Possible statuses: 'created', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
COMMENT ON COLUMN orders.status IS 'Order status: created, confirmed, preparing, ready, completed, cancelled';
COMMENT ON COLUMN orders.estimated_ready_time IS 'Estimated time when order will be ready';
COMMENT ON COLUMN orders.actual_ready_time IS 'Actual time when order was marked ready';
COMMENT ON COLUMN orders.queue_position IS 'Position in preparation queue';
COMMENT ON COLUMN orders.preparation_time_minutes IS 'Estimated preparation time in minutes';
COMMENT ON COLUMN orders.notified_ready IS 'Whether customer was notified order is ready';

-- Create order_status_history table to track all status changes
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100), -- 'system', 'admin', 'staff_name'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_ready ON orders(estimated_ready_time);

-- Create function to calculate queue position and estimated time
CREATE OR REPLACE FUNCTION calculate_order_queue_position(new_order_id INTEGER)
RETURNS TABLE(queue_pos INTEGER, estimated_minutes INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
    orders_ahead INTEGER;
    total_prep_time INTEGER;
    base_prep_time INTEGER := 15; -- Default 15 minutes per order
BEGIN
    -- Count orders ahead in queue (confirmed or preparing status)
    SELECT COUNT(*) INTO orders_ahead
    FROM orders
    WHERE id < new_order_id 
    AND status IN ('confirmed', 'preparing')
    AND restaurant_id = (SELECT restaurant_id FROM orders WHERE id = new_order_id);
    
    -- Calculate total preparation time
    -- Base time + (orders ahead * 5 minutes buffer per order)
    total_prep_time := base_prep_time + (orders_ahead * 5);
    
    RETURN QUERY SELECT orders_ahead + 1, total_prep_time;
END;
$$;

-- Create function to update order status with history tracking
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_new_status VARCHAR(50),
    p_changed_by VARCHAR(100) DEFAULT 'system',
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_customer_id VARCHAR(255);
    v_platform VARCHAR(50);
BEGIN
    -- Get current status and customer info
    SELECT status, customer_platform_id, platform 
    INTO v_old_status, v_customer_id, v_platform
    FROM orders 
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;
    
    -- Update order status
    UPDATE orders 
    SET 
        status = p_new_status,
        status_updated_at = CURRENT_TIMESTAMP,
        actual_ready_time = CASE WHEN p_new_status = 'ready' THEN CURRENT_TIMESTAMP ELSE actual_ready_time END
    WHERE id = p_order_id;
    
    -- Log status change in history
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
    VALUES (p_order_id, v_old_status, p_new_status, p_changed_by, p_notes);
    
    RETURN TRUE;
END;
$$;

-- Create trigger to auto-calculate queue position on order creation
CREATE OR REPLACE FUNCTION trigger_set_order_queue_position()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    queue_data RECORD;
BEGIN
    -- Calculate queue position and estimated time
    SELECT * INTO queue_data FROM calculate_order_queue_position(NEW.id);
    
    -- Update the new order with queue info
    NEW.queue_position := queue_data.queue_pos;
    NEW.preparation_time_minutes := queue_data.estimated_minutes;
    NEW.estimated_ready_time := CURRENT_TIMESTAMP + (queue_data.estimated_minutes || ' minutes')::INTERVAL;
    
    RETURN NEW;
END;
$$;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS set_order_queue_position ON orders;
CREATE TRIGGER set_order_queue_position
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_order_queue_position();

-- ================================================
-- SAMPLE QUERIES FOR TESTING
-- ================================================

-- Check order queue and status
-- SELECT 
--     id as order_id,
--     status,
--     queue_position,
--     preparation_time_minutes,
--     estimated_ready_time,
--     actual_ready_time,
--     created_at
-- FROM orders
-- WHERE status IN ('confirmed', 'preparing')
-- ORDER BY id;

-- Get order status history
-- SELECT 
--     osh.id,
--     osh.order_id,
--     osh.old_status,
--     osh.new_status,
--     osh.changed_by,
--     osh.notes,
--     osh.created_at
-- FROM order_status_history osh
-- WHERE osh.order_id = 1
-- ORDER BY osh.created_at DESC;

-- Update order status (example)
-- SELECT update_order_status(1, 'preparing', 'admin', 'Started preparation');
-- SELECT update_order_status(1, 'ready', 'admin', 'Order ready for pickup');

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

SELECT '✅ Order status tracking system installed!' as status;
SELECT '📊 New features: Queue management, estimated times, status notifications' as features;