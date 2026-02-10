import { sendMessage } from "./response.js";
import db from "../db.js";

/**
 * Send order confirmation with estimated ready time
 */
export async function sendOrderConfirmationWithTime(
  orderId,
  userId,
  platform,
  businessId,
) {
  try {
    // Get order details with queue info
    const orderResult = await db.query(
      `
      SELECT 
        o.id,
        o.queue_position,
        o.preparation_time_minutes,
        o.estimated_ready_time,
        o.total_amount,
        o.status,
        r.name as restaurant_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = $1
      GROUP BY o.id, r.name
    `,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    const order = orderResult.rows[0];
    const orderNumber = String(orderId).padStart(4, "0");

    // Format estimated ready time
    const readyTime = new Date(order.estimated_ready_time);
    const readyTimeStr = readyTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Build message
    let message = `✅ Order Confirmed!\n\n`;
    message += `📋 Order Number: #${orderNumber}\n`;
    message += `🛒 Items: ${order.item_count}\n`;
    message += `💰 Total: AUD ${parseFloat(order.total_amount).toFixed(2)}\n\n`;

    // Queue information
    if (order.queue_position > 1) {
      message += `📊 Queue Position: ${order.queue_position}\n`;
      message += `⏱️ Estimated Ready Time: ${readyTimeStr} (~${order.preparation_time_minutes} min)\n\n`;
    } else {
      message += `⏱️ Your order will be ready in ~${order.preparation_time_minutes} minutes (by ${readyTimeStr})\n\n`;
    }

    message += `👨‍🍳 Our kitchen is preparing your order!\n`;
    message += `📱 We'll notify you when it's ready.\n\n`;
    message += `Thank you for choosing ${order.restaurant_name || "our restaurant"}! 🥟`;

    await sendMessage(userId, platform, message, { businessId });

    console.log(
      `✅ Order confirmation with time sent for Order #${orderNumber}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending order confirmation with time:", error);
    return false;
  }
}

/**
 * Send notification when order status changes to 'ready'
 */
export async function sendOrderReadyNotification(
  orderId,
  userId,
  platform,
  businessId,
) {
  try {
    // Get order details
    const orderResult = await db.query(
      `
      SELECT 
        o.id,
        o.total_amount,
        o.service_type,
        o.payment_method,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    const order = orderResult.rows[0];
    const orderNumber = String(orderId).padStart(4, "0");

    // Build ready notification
    let message = `🎉 Your Order is Ready!\n\n`;
    message += `📋 Order #${orderNumber}\n`;
    message += `🛒 ${order.item_count} item(s) - AUD ${parseFloat(order.total_amount).toFixed(2)}\n\n`;

    if (order.service_type === "dine_in") {
      message += `📍 Please collect your order from the counter.\n`;
    } else if (order.service_type === "takeaway") {
      message += `📦 Your order is ready for pickup!\n`;
    } else if (order.service_type === "delivery") {
      message += `🚗 Your order is ready and will be delivered soon!\n`;
    }

    if (order.payment_method === "cash") {
      message += `💵 Payment: Cash on collection\n`;
    }

    message += `\nEnjoy your meal! 🥟✨`;

    await sendMessage(userId, platform, message, { businessId });

    // Mark as notified in database
    await db.query("UPDATE orders SET notified_ready = true WHERE id = $1", [
      orderId,
    ]);

    console.log(`✅ Order ready notification sent for Order #${orderNumber}`);
    return true;
  } catch (error) {
    console.error("Error sending order ready notification:", error);
    return false;
  }
}

/**
 * Send notification when order status changes to 'preparing'
 */
export async function sendOrderPreparingNotification(
  orderId,
  userId,
  platform,
  businessId,
) {
  try {
    const orderNumber = String(orderId).padStart(4, "0");

    const message =
      `👨‍🍳 Good news!\n\n` +
      `Your Order #${orderNumber} is now being prepared in our kitchen.\n\n` +
      `We'll notify you when it's ready! 🥟`;

    await sendMessage(userId, platform, message, { businessId });

    console.log(`✅ Preparing notification sent for Order #${orderNumber}`);
    return true;
  } catch (error) {
    console.error("Error sending preparing notification:", error);
    return false;
  }
}

/**
 * Send thank you message (for conversation end)
 */
export async function sendThankYouMessage(
  userId,
  platform,
  businessId,
  reason = "general",
  restaurantName = "our restaurant",
) {
  try {
    let message = "";

    if (reason === "underage") {
      message =
        `Thank you for your interest in ${restaurantName}! \n\n` +
        `Unfortunately, we can only serve customers who are 18 years or older due to our alcohol offerings.\n\n` +
        `We appreciate your understanding. Have a wonderful day! 🌟`;
    } else if (reason === "order_complete") {
      message =
        `Thank you for ordering with ${restaurantName}! 🙏\n\n` +
        `We hope you enjoyed your meal! ✨\n\n` +
        `We'd love to see you again soon. Have a great day! 🌟`;
    } else {
      message =
        `Thank you for visiting ${restaurantName}! 🙏\n\n` +
        `We hope to serve you soon! \n\n` +
        `Have a wonderful day! 🌟`;
    }

    await sendMessage(userId, platform, message, { businessId });

    console.log(`✅ Thank you message sent (${reason})`);
    return true;
  } catch (error) {
    console.error("Error sending thank you message:", error);
    return false;
  }
}

/**
 * Monitor orders and send notifications based on status changes
 * This can be called by an admin API or automatically by a cron job
 */
export async function processOrderStatusChange(
  orderId,
  newStatus,
  changedBy = "admin",
  notes = null,
) {
  try {
    // Get order info before updating
    const orderResult = await db.query(
      `
      SELECT customer_platform_id, platform, restaurant_id
      FROM orders 
      WHERE id = $1
    `,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const {
      customer_platform_id: userId,
      platform,
      restaurant_id: restaurantId,
    } = orderResult.rows[0];

    // Update status using our stored function
    await db.query("SELECT update_order_status($1, $2, $3, $4)", [
      orderId,
      newStatus,
      changedBy,
      notes,
    ]);

    // Get businessId for this restaurant (for multi-tenant support)
    let businessId = null;
    if (platform === "messenger") {
      const fbResult = await db.query(
        "SELECT page_id FROM facebook_credentials WHERE restaurant_id = $1 LIMIT 1",
        [restaurantId],
      );
      if (fbResult.rows.length > 0) {
        businessId = fbResult.rows[0].page_id;
      }
    } else if (platform === "whatsapp") {
      const waResult = await db.query(
        "SELECT phone_number_id FROM whatsapp_credentials WHERE restaurant_id = $1 AND is_active = true LIMIT 1",
        [restaurantId],
      );
      if (waResult.rows.length > 0) {
        businessId = waResult.rows[0].phone_number_id;
      }
    }

    // Fetch restaurant name for dynamic messages
    const restResult = await db.query(
      "SELECT name FROM restaurants WHERE id = $1",
      [restaurantId],
    );
    const restaurantName = restResult.rows[0]?.name || "our restaurant";

    // Send appropriate notification based on new status
    if (newStatus === "preparing") {
      await sendOrderPreparingNotification(
        orderId,
        userId,
        platform,
        businessId,
      );
    } else if (newStatus === "ready") {
      await sendOrderReadyNotification(orderId, userId, platform, businessId);
    } else if (newStatus === "delivered") {
      // Order picked up/completed - optional thank you message
      await sendThankYouMessage(userId, platform, businessId, "order_complete", restaurantName);
    }

    console.log(`✅ Order ${orderId} status changed to: ${newStatus}`);
    return { success: true, orderId, newStatus };
  } catch (error) {
    console.error("Error processing order status change:", error);
    return { success: false, error: error.message };
  }
}

export default {
  sendOrderConfirmationWithTime,
  sendOrderReadyNotification,
  sendOrderPreparingNotification,
  sendThankYouMessage,
  processOrderStatusChange,
};
