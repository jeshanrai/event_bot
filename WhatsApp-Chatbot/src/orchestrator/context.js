import db from '../db.js';

async function getContext(userId) {
  try {
    const res = await db.query(
      'SELECT context, cart, age_verified FROM sessions WHERE user_id = $1',
      [userId]
    );

    if (res.rows.length > 0) {
      const { context, cart, age_verified } = res.rows[0];
      // Merge distinct columns back into context object
      return {
        ...context,
        cart: cart || [],
        age_verified: age_verified || false
      };
    }

    // Default context
    const defaultContext = {
      stage: 'initial',
      cart: [],
      history: [],
      payment_method: null,
      service_type: null,
      delivery_address: null,
      age_verified: false
    };

    // Create new session
    await db.query(
      'INSERT INTO sessions (user_id, context, cart, age_verified) VALUES ($1, $2, $3, $4)',
      [userId, defaultContext, '[]', false]
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
    // Separate cart and age_verified from the rest of the context
    // These are stored in their own columns for easier querying
    const { cart, age_verified, ...restContext } = fullContext;

    await db.query(
      `INSERT INTO sessions (user_id, context, cart, age_verified, updated_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       ON CONFLICT (user_id) 
       DO UPDATE SET context = $2, cart = $3, age_verified = $4, updated_at = NOW()`,
      [userId, restContext, JSON.stringify(cart || []), age_verified || false]
    );
  } catch (error) {
    console.error('Error updating context:', error);
  }
}

export { getContext, updateContext };
