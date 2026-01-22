import db from '../db.js';

async function getContext(userId) {
  try {
    const res = await db.query(
      'SELECT context, cart FROM sessions WHERE user_id = $1',
      [userId]
    );

    if (res.rows.length > 0) {
      const { context, cart } = res.rows[0];
      // Merge distinct cart column back into context object
      // The context column now holds all other fields (payment_method, service_type, etc.)
      return {
        ...context,
        cart: cart || []
      };
    }

    // Default context
    const defaultContext = {
      stage: 'initial',
      cart: [],
      history: [],
      payment_method: null,
      service_type: null,
      delivery_address: null
    };

    // Create new session
    // We only insert user_id, context, and cart. 
    // All other fields are part of the 'context' JSON object.
    await db.query(
      'INSERT INTO sessions (user_id, context, cart) VALUES ($1, $2, $3)',
      [userId, defaultContext, '[]']
    );

    return defaultContext;
  } catch (error) {
    console.error('Error getting context:', error);
    // Fallback to memory if DB fails (prevent crash)
    return {
      stage: 'initial',
      cart: [],
      history: [],
      payment_method: null,
      service_type: null,
      delivery_address: null
    };
  }
}

async function updateContext(userId, fullContext) {
  try {
    // Separate cart from the rest of the context
    // 'cart' is stored in its own column for potential analytics/easier querying
    // EVERYTHING else goes into the 'context' JSONB column
    const { cart, ...restContext } = fullContext;

    await db.query(
      `INSERT INTO sessions (user_id, context, cart, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (user_id) 
       DO UPDATE SET context = $2, cart = $3, updated_at = NOW()`,
      [userId, restContext, JSON.stringify(cart || [])]
    );
  } catch (error) {
    console.error('Error updating context:', error);
  }
}

export { getContext, updateContext };
