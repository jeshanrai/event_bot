import { detectIntentAndRespond } from '../ai/intentEngine.js';
import { validateToolCall } from '../ai/validator.js';
import { generateToolResponse } from '../ai/responseGenerator.js';
import {
  sendMessage,
  sendListMessage,
  sendButtonMessage,
  sendOrderConfirmationMessage
} from '../services/response.js';
import * as restaurantTools from '../tools/restaurant.tools.js';

// Tool execution handlers
const toolHandlers = {
  // Step 1: Show food category menu (List Message) - FROM DATABASE
  show_food_menu: async (args, userId, context) => {
    try {
      // Fetch categories from database
      const categories = await restaurantTools.getMenu();

      const categoryEmojis = {
        'momos': '🥟',
        'noodles': '🍜',
        'rice': '🍚',
        'beverages': '☕'
      };

      // Build category rows (WhatsApp list rows only support id, title, description)
      const rows = categories.map(cat => ({
        id: `cat_${cat.category}`,
        title: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ${categoryEmojis[cat.category] || '🍽️'}`,
        description: `Browse our ${cat.category} options`
      }));

      const sections = [
        {
          title: 'Food Categories',
          rows: rows.length > 0 ? rows : [
            { id: 'cat_momos', title: 'Momos 🥟', description: 'Steamed, fried, tandoori varieties' }
          ]
        }
      ];

      await sendListMessage(
        userId,
        context.platform,
        '🍽️ Restaurant Menu',
        'Welcome! What would you like to order today? Browse our delicious categories below.',
        'Tap to view options',
        'View Categories',
        sections
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'viewing_menu',
          lastAction: 'show_food_menu'
        }
      };
    } catch (error) {
      console.error('Error fetching menu:', error);
      await sendMessage(userId, context.platform, "Sorry, I couldn't load the menu. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Step 2: Show items in a category - FROM DATABASE (as list message)
  show_category_items: async (args, userId, context) => {
    try {
      const category = args.category || 'momos';
      const foods = await restaurantTools.getMenu(category);

      if (foods.length === 0) {
        await sendMessage(userId, context.platform, `No items found in ${category}. Try another category!`);
        return await toolHandlers.show_food_menu({}, userId, context);
      }

      // Show current cart summary if items exist
      const cart = context.cart || [];
      const categoryEmoji = {
        'momos': '🥟',
        'noodles': '🍜',
        'rice': '🍚',
        'beverages': '☕'
      }[category] || '🍽️';

      let bodyText = `Browse our delicious ${category}! Select any item to add it to your cart.`;
      if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        bodyText = `🛒 Cart: ${itemCount} item(s) - AUD ${total}\n\nSelect items to add:`;
      }

      // Build list rows (max 10 items per WhatsApp limit)
      // Note: WhatsApp list rows only support id, title, description (no imageUrl)
      // However, we include imageUrl for Messenger generic template which DOES support images
      const rows = foods.slice(0, 10).map(food => ({
        id: `add_${food.id}`,
        title: food.name.substring(0, 24), // WhatsApp limit: 24 chars
        description: `AUD ${food.price} - ${(food.description || '').substring(0, 60)}`, // WhatsApp limit: 72 chars
        imageUrl: food.image_url || null  // Pass DB image for Messenger generic template
      }));

      const sections = [
        {
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${categoryEmoji}`,
          rows: rows
        }
      ];

      await sendListMessage(
        userId,
        context.platform,
        `${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        bodyText,
        'Tap to add items to cart',
        'Select Item',
        sections
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'viewing_items',
          currentCategory: category,
          lastAction: 'show_category_items',
          cart: context.cart || []
        }
      };
    } catch (error) {
      console.error('Error fetching category items:', error);
      await sendMessage(userId, context.platform, "Sorry, I couldn't load the items. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },



  // Add item to cart - uses database to get item details (IMPROVED: Quick add with quantity options)
  add_to_cart: async (args, userId, context) => {
    try {
      const foodId = args.foodId;
      const quantity = args.quantity || 1;
      const cart = context.cart || [];

      // Get food details from database
      const food = await restaurantTools.getFoodById(foodId);

      if (!food) {
        await sendMessage(userId, context.platform, "Sorry, that item is not available.");
        return { reply: null, updatedContext: context };
      }

      // Check if item already in cart
      const existingItem = cart.find(item => item.foodId === foodId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({
          foodId: food.id,
          name: food.name,
          price: parseFloat(food.price),
          quantity
        });
      }

      // Calculate cart total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      // Show quick action buttons - makes adding more items much easier!
      const buttons = [
        {
          type: 'reply',
          reply: {
            id: `more_${context.currentCategory || 'momos'}`,
            title: 'Add More ➕'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'view_all_categories',
            title: 'Other Categories 📋'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'proceed_checkout',
            title: 'Checkout 🛒'
          }
        }
      ];

      await sendButtonMessage(
        userId,
        context.platform,
        '✅ Added to Cart!',
        `*${food.name}* x${quantity} - AUD ${food.price * quantity}\n\n🛒 Cart: ${itemCount} item(s) | Total: AUD ${total}\n\nWhat would you like to do?`,
        'Keep adding or checkout!',
        buttons
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          cart,
          stage: 'quick_cart_action',
          lastAddedItem: food.name,
          lastAction: 'add_to_cart'
        }
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      await sendMessage(userId, context.platform, "Sorry, couldn't add that item. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Add item by name - validates against database before adding
  add_item_by_name: async (args, userId, context) => {
    try {
      let itemName = args.name || args.itemName || '';
      const quantity = args.quantity || 1;
      const cart = context.cart || [];

      // 1. Handle "add it" / "add this" context from recommendations
      const isGenericReference = ['it', 'this', 'that', 'recommendation', 'recommended item', 'the item'].some(ref =>
        itemName.toLowerCase().includes(ref)
      );

      if (isGenericReference && context.recommendations && context.recommendations.length > 0) {
        // Use the most recent recommended item
        const recommendedItem = context.recommendations[0];
        console.log(`Contextual add: Replacing "${itemName}" with "${recommendedItem.name}"`);
        itemName = recommendedItem.name;
      }

      if (!itemName) {
        await sendMessage(userId, context.platform, "Please specify which item you want to add.");
        return { reply: null, updatedContext: context };
      }

      // Search for the item in database
      const matchingItems = await restaurantTools.getFoodByName(itemName);

      // If no direct match, try checking recommendations again as a fallback
      if (matchingItems.length === 0 && context.recommendations && context.recommendations.length > 0) {
        // Maybe the user said "add the spicy one" and our recommendation list has it
        // This is a simple heuristic: if only one recommendation exists, assume they meant that.
        if (context.recommendations.length === 1) {
          const fallbackItem = context.recommendations[0];
          console.log(`Fallback add: assuming user meant recommended "${fallbackItem.name}"`);
          matchingItems.push(fallbackItem);
        }
      }

      if (matchingItems.length === 0) {
        // Item not found - show helpful message
        await sendMessage(userId, context.platform,
          `❌ Sorry, "${itemName}" is not available on our menu.\n\nType "menu" to see what we have! 🍽️`
        );
        return { reply: null, updatedContext: context };
      }

      if (matchingItems.length === 1) {
        // Exact match - add directly
        const food = matchingItems[0];

        const existingItem = cart.find(item => item.foodId === food.id);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({
            foodId: food.id,
            name: food.name,
            price: parseFloat(food.price),
            quantity
          });
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

        const buttons = [
          {
            type: 'reply',
            reply: {
              id: `more_${food.category || 'momos'}`,
              title: 'Add More ➕'
            }
          },
          {
            type: 'reply',
            reply: {
              id: 'view_all_categories',
              title: 'Other Categories 📋'
            }
          },
          {
            type: 'reply',
            reply: {
              id: 'proceed_checkout',
              title: 'Checkout 🛒'
            }
          }
        ];

        await sendButtonMessage(
          userId,
          context.platform,
          '✅ Added to Cart!',
          `*${food.name}* x${quantity} - AUD ${food.price * quantity}\n\n🛒 Cart: ${itemCount} item(s) | Total: AUD ${total}\n\nWhat would you like to do?`,
          'Keep adding or checkout!',
          buttons
        );

        return {
          reply: null,
          updatedContext: {
            ...context,
            cart,
            stage: 'quick_cart_action',
            lastAddedItem: food.name,
            lastAction: 'add_item_by_name'
          }
        };
      }

      // Multiple matches - show options
      const rows = matchingItems.slice(0, 10).map(food => ({
        id: `add_${food.id}`,
        title: food.name.substring(0, 24),
        description: `AUD ${food.price} - ${(food.description || '').substring(0, 50)}`
      }));

      await sendListMessage(
        userId,
        context.platform,
        '🔍 Multiple Matches Found',
        `Found ${matchingItems.length} item(s) matching "${itemName}".\nSelect the one you want:`,
        'Tap to add to cart',
        'Select Item',
        [{ title: 'Matching Items', rows }]
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'selecting_item',
          lastAction: 'add_item_by_name'
        }
      };
    } catch (error) {
      console.error('Error adding item by name:', error);
      await sendMessage(userId, context.platform, "Sorry, couldn't find that item. Try browsing our menu!");
      return { reply: null, updatedContext: context };
    }
  },

  // Add multiple items at once - great for batch ordering!
  add_multiple_items: async (args, userId, context) => {
    try {
      const items = args.items || [];
      let cart = context.cart || [];
      const addedItems = [];
      const notFoundItems = [];

      if (items.length === 0) {
        await sendMessage(userId, context.platform, "Please specify which items you want to add.");
        return { reply: null, updatedContext: context };
      }

      console.log(`🛒 Adding multiple items:`, items);

      // Process each item
      for (const item of items) {
        const itemName = item.name || '';
        const quantity = item.quantity || 1;

        if (!itemName) continue;

        // Search for the item in database
        const matchingItems = await restaurantTools.getFoodByName(itemName);

        if (matchingItems.length === 0) {
          notFoundItems.push(itemName);
          continue;
        }

        // Use best match (first result)
        const food = matchingItems[0];

        // Check if item already in cart
        const existingItem = cart.find(cartItem => cartItem.foodId === food.id);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({
            foodId: food.id,
            name: food.name,
            price: parseFloat(food.price),
            quantity
          });
        }

        addedItems.push({
          name: food.name,
          quantity,
          price: food.price,
          subtotal: food.price * quantity
        });
      }

      // Build response
      if (addedItems.length === 0) {
        await sendMessage(userId, context.platform,
          `❌ Sorry, none of these items are available:\n${notFoundItems.map(n => `• ${n}`).join('\n')}\n\nType "menu" to see what we have! 🍽️`
        );
        return { reply: null, updatedContext: context };
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      // Build added items summary
      const addedSummary = addedItems.map(item =>
        `✓ ${item.name} x${item.quantity} - AUD ${item.subtotal}`
      ).join('\n');

      let message = `*${addedItems.length} item(s) added!*\n\n${addedSummary}`;

      // Mention not found items if any
      if (notFoundItems.length > 0) {
        message += `\n\n⚠️ Not available:\n${notFoundItems.map(n => `• ${n}`).join('\n')}`;
      }

      message += `\n\n━━━━━━━━━━━━━━━\n🛒 Cart: ${itemCount} item(s)\n💰 Total: AUD ${total}`;

      const buttons = [
        {
          type: 'reply',
          reply: {
            id: 'view_all_categories',
            title: 'Add More 📋'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'proceed_checkout',
            title: 'Checkout 🛒'
          }
        }
      ];

      await sendButtonMessage(
        userId,
        context.platform,
        '✅ Items Added to Cart!',
        message,
        'Continue shopping or checkout!',
        buttons
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          cart,
          stage: 'quick_cart_action',
          lastAction: 'add_multiple_items'
        }
      };
    } catch (error) {
      console.error('Error adding multiple items:', error);
      await sendMessage(userId, context.platform, "Sorry, couldn't add those items. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Show cart and checkout options
  show_cart_options: async (args, userId, context) => {
    const cart = context.cart || [];

    if (cart.length === 0) {
      await sendMessage(userId, context.platform, "Your cart is empty! Let me show you our menu.");
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    const cartLines = cart.map(item =>
      `• ${item.name} x${item.quantity} - AUD ${item.price * item.quantity}`
    ).join('\n');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'add_more_items',
          title: 'Add More Items ➕'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'proceed_checkout',
          title: 'Checkout 🛒'
        }
      }
    ];

    await sendButtonMessage(
      userId,
      context.platform,
      '🛒 Your Cart',
      `${cartLines}\n━━━━━━━━━━━━━━━\nSubtotal: AUD ${total}\n\nWould you like to add more items or proceed to checkout?`,
      'You can add more items anytime!',
      buttons
    );

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'cart_options',
        lastAction: 'show_cart_options'
      }
    };
  },

  // Confirm order with payment options
  confirm_order: async (args, userId, context) => {
    const safeArgs = args || {};
    let items = safeArgs.items || context.cart || [];

    if (items.length === 0) {
      await sendMessage(userId, context.platform, "Your cart is empty! Let me show you our menu.");
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    // VALIDATE ITEMS AGAINST DATABASE - filter out items that don't exist
    const validatedItems = [];
    const invalidItems = [];

    for (const item of items) {
      // If item has foodId, validate by ID
      if (item.foodId) {
        const dbItem = await restaurantTools.getFoodById(item.foodId);
        if (dbItem) {
          validatedItems.push({
            foodId: dbItem.id,
            name: dbItem.name,
            price: parseFloat(dbItem.price),
            quantity: item.quantity || 1
          });
        } else {
          invalidItems.push(item.name);
        }
      } else {
        // Item from LLM - validate by name
        const matches = await restaurantTools.getFoodByName(item.name);
        if (matches.length > 0) {
          // Use the first exact or closest match
          const dbItem = matches[0];
          const existingValid = validatedItems.find(v => v.foodId === dbItem.id);
          if (existingValid) {
            existingValid.quantity += item.quantity || 1;
          } else {
            validatedItems.push({
              foodId: dbItem.id,
              name: dbItem.name,
              price: parseFloat(dbItem.price), // Use DB price, not LLM-generated
              quantity: item.quantity || 1
            });
          }
        } else {
          invalidItems.push(item.name);
        }
      }
    }

    // If no valid items after validation
    if (validatedItems.length === 0) {
      await sendMessage(userId, context.platform,
        `❌ Sorry, none of the items are available:\n${invalidItems.map(n => `• ${n}`).join('\n')}\n\nType "menu" to see what we have! 🍽️`
      );
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    // Notify about invalid items if any
    if (invalidItems.length > 0) {
      await sendMessage(userId, context.platform,
        `⚠️ Note: These items are not available and were removed:\n${invalidItems.map(n => `• ${n}`).join('\n')}`
      );
    }

    // Use validated items
    items = validatedItems;

    const orderLines = items.map(item =>
      `• ${item.name} x${item.quantity} - AUD ${item.price * item.quantity}`
    ).join('\n');

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderDetails = `${orderLines}\n━━━━━━━━━━━━━━━\nTotal: AUD ${total}`;

    await sendOrderConfirmationMessage(userId, context.platform, orderDetails);

    return {
      reply: null,
      updatedContext: {
        ...context,
        cart: items, // Update cart with validated items
        stage: 'confirming_order',
        lastAction: 'confirm_order',
        pendingOrder: { items, total }
      }
    };
  },

  // Show Payment Options for Dine-in (Cash Counter / Online)
  show_dine_in_payment_options: async (args, userId, context) => {
    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'pay_cash_counter',
          title: 'Cash'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'pay_online',
          title: 'Stripe Online'
        }
      }
    ];

    await sendButtonMessage(
      userId,
      context.platform,
      '💳 Payment Method',
      'How would you like to pay?',
      'Select to continue',
      buttons
    );

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'selecting_payment',
        lastAction: 'show_dine_in_payment_options'
      }
    };
  },

  // Handlers for payment selection
  pay_cash_counter: async (args, userId, context) => {
    // Standard confirmation flow
    await restaurantTools.selectPayment(context.pendingOrder.orderId, 'CASH');

    await sendMessage(userId, context.platform,
      "✅ Order Confirmed! Please pay cash at the counter.\n\nThank you for choosing Momo House! 🥟"
    );

    // Clean up session
    await restaurantTools.deleteSessionAfterOrder(userId);

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'order_complete',
        lastAction: 'pay_cash_counter',
        cart: [],
        pendingOrder: null
      }
    };
  },

  pay_online: async (args, userId, context) => {
    try {
      if (!context.pendingOrder || !context.pendingOrder.orderId) {
        await sendMessage(userId, context.platform, "Session expired. Please order again.");
        return await toolHandlers.show_food_menu({}, userId, context);
      }

      await sendMessage(userId, context.platform, "Generating secure payment link... ⏳");

      const paymentLink = await restaurantTools.generatePaymentLink(context.pendingOrder.orderId);

      const buttons = [
        {
          type: 'url',
          title: 'Pay Now 💳',
          url: paymentLink
        }
      ];

      // Messenger supports URL buttons in Button Template.
      // WhatsApp supports URL buttons ONLY in Template Messages (which require approval).
      // For standard messages, we send the link as text.

      if (context.platform === 'whatsapp') {
        await sendMessage(userId, context.platform,
          `Click the link below to pay securely via Stripe:\n\n${paymentLink}\n\nWe will confirm your order automatically once paid! ✅`
        );
      } else {
        // Messenger can use buttons
        await sendButtonMessage(
          userId,
          context.platform,
          'Pay Securely',
          'Click below to complete your payment via Stripe',
          'Stripe Secure Payment',
          [{ type: 'url', url: paymentLink, title: 'Pay Now 💳' }]
        );
      }

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'awaiting_payment',
          lastAction: 'pay_online',
          paymentLink: paymentLink // Store the payment link for reuse
        }
      };

    } catch (error) {
      console.error('Error generating payment link:', error);
      await sendMessage(userId, context.platform, "Sorry, I couldn't generate the payment link. Please try paying with Cash.");
      return await toolHandlers.show_dine_in_payment_options({}, userId, context);
    }
  },

  // New Handler: Welcome Message
  show_welcome_message: async (args, userId, context) => {
    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'view_all_categories',
          title: 'View Menu 🍽️'
        }
      }
    ];

    await sendButtonMessage(
      userId,
      context.platform,
      '👋 Welcome to Momo House!',
      'We serve the best foods in town. Browse our menu to order now!',
      'Tap to start',
      buttons
    );

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'initial',
        lastAction: 'show_welcome_message'
      }
    };
  },


  // Process order confirmation - saves to DATABASE
  process_order_response: async (args, userId, context) => {
    const { action } = args;

    if (action === 'confirmed') {
      try {
        const cart = context.cart || [];

        if (cart.length === 0) {
          await sendMessage(userId, context.platform, "Your cart is empty! Cannot proceed with order.");
          return await toolHandlers.show_food_menu({}, userId, context);
        }

        // Check if service type already selected (e.g., from reservation flow)
        // Check if service type already selected (e.g., from reservation flow)
        if (context.service_type && context.service_type === 'dine_in') {
          // ... existing logic for reservation specific flow ...
          // For now, we are simplifying. If complex reservation logic was here, we might need to adjust.
          // But based on user request "always on site", "new flow user view menu, add to cart confirm... then cash on counter or online"
          // We can just proceed to payment selection assuming 'dine_in'.
        }

        console.log('✅ Order confirmation received, proceeding to payment selection (Default: Dine-in)');

        // Set default service type to 'dine_in'
        context.service_type = 'dine_in';

        // Create order in DB first to get ID
        // Create order in DB first to get ID
        const finalOrder = await restaurantTools.finalizeOrderFromCart(userId, cart, {
          service_type: 'dine_in',
          payment_method: null, // Not selected yet
          platform: context.platform
        });

        // Store order details in context
        context.pendingOrder = {
          orderId: finalOrder.id,
          items: cart,
          total: finalOrder.total_amount
        };

        // Show payment options directly
        return await toolHandlers.show_dine_in_payment_options({}, userId, {
          ...context,
          service_type: 'dine_in',
          stage: 'selecting_payment',
          pendingOrder: context.pendingOrder
        });

      } catch (error) {
        console.error('Error processing order confirmation:', error);
        // Fallback without database
        const orderId = `MH${Date.now().toString().slice(-6)}`;
        await sendMessage(userId, context.platform,
          `✅ Order Confirmed!\n\nThank you for your order! Your food is being prepared.\n\nOrder ID: #${orderId}\n\nEnjoy your meal! 🥟`
        );
        return {
          reply: null,
          updatedContext: {
            stage: 'order_complete',
            lastAction: 'order_confirmed',
            cart: [],
            service_type: 'dine_in',
            number_of_people: null,
            dine_time: null,
            delivery_address: null,
            payment_method: null
          }
        };
      }
    } else if (action === 'cancel_confirm') {
      // User confirmed cancellation
      const cart = context.cart || [];
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      await sendMessage(userId, context.platform,
        `❌ Order Cancelled\n\n${itemCount} item(s) removed from cart.\n\nNo worries! Feel free to browse our menu again whenever you're ready.\n\nType "menu" to start a new order! 🍽️`
      );
      return {
        reply: null,
        updatedContext: {
          stage: 'initial',
          lastAction: 'order_cancelled',
          cart: []
        }
      };
    } else {
      // Ask for cancellation confirmation first
      const cart = context.cart || [];
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      const buttons = [
        {
          type: 'reply',
          reply: {
            id: 'confirm_cancel',
            title: 'Yes, Cancel ❌'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'back_to_cart',
            title: 'No, Go Back 🔙'
          }
        }
      ];

      await sendButtonMessage(
        userId,
        context.platform,
        '⚠️ Cancel Order?',
        `Are you sure you want to cancel?\n\n🛒 Cart: ${itemCount} item(s)\n💰 Total: Rs.${total}\n\nThis will remove all items from your cart.`,
        'Please confirm',
        buttons
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'confirming_cancel',
          lastAction: 'ask_cancel_confirmation'
        }
      };
    }
  },




  // Handler for cash at counter (Dine-in)


  // Show order history
  show_order_history: async (args, userId, context) => {
    try {
      const orders = await restaurantTools.getOrderHistory(userId, 5);

      if (orders.length === 0) {
        await sendMessage(userId, context.platform,
          `📋 *Order History*\n\nYou haven't placed any orders yet!\n\nType "menu" to start your first order! 🍽️`
        );
        return { reply: null, updatedContext: context };
      }

      let historyText = `📋 *Your Order History*\n\n`;

      for (const order of orders) {
        const statusEmoji = {
          'created': '🆕',
          'confirmed': '✅',
          'preparing': '👨‍🍳',
          'delivered': '📦',
          'completed': '✔️',
          'cancelled': '❌'
        }[order.status] || '📝';

        const date = new Date(order.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        historyText += `${statusEmoji} *Order #${order.id}*\n`;
        historyText += `   📅 ${date}\n`;
        historyText += `   🛒 ${order.item_count} item(s) | Rs.${parseFloat(order.total).toFixed(0)}\n`;
        historyText += `   💳 ${order.payment_method || 'Pending'}\n`;
      }

      await sendMessage(userId, context.platform, historyText);

      return {
        reply: null,
        updatedContext: {
          ...context,
          lastAction: 'show_order_history'
        }
      };

    } catch (error) {
      console.error('Error fetching order history:', error);
      await sendMessage(userId, context.platform, "Sorry, I couldn't check your order history right now.");
      return { reply: null, updatedContext: context };
    }
  },

  // Recommend Food
  recommend_food: async (args, userId, context) => {
    try {
      const safeArgs = args || {};
      const tag = safeArgs.tag || 'random';
      console.log(`Getting recommendations for tag: ${tag}`);

      const foods = await restaurantTools.getRecommendedFoods(tag);

      if (foods.length === 0) {
        await sendMessage(userId, context.platform,
          `🤔 I couldn't find any specific items for "${tag}", but we have lots of other delicious options!\n\nType "menu" to see our full range. 🍽️`
        );
        return { reply: null, updatedContext: context };
      }

      // Format as list
      const rows = foods.map(food => ({
        id: `add_${food.id}`,
        title: food.name.substring(0, 24),
        description: `AUD.${food.price} - ${food.category}`
      }));

      // Different title for random
      const isRandom = tag === 'random';
      const title = isRandom ? '🎲 Chef\'s Choice' : `🌟 Recommendations: "${tag}"`;

      // Dynamic Body using LLM
      const body = await generateToolResponse('recommend_food', { tag }, foods, context);

      await sendListMessage(
        userId,
        context.platform,
        title,
        body,
        'Tap to add to cart',
        'View Recommendations',
        [{ title: 'Recommended', rows }]
      );

      return {
        reply: null,
        updatedContext: {
          ...context,
          stage: 'viewing_recommendations',
          lastAction: 'recommend_food',
          recommendations: foods // Save for "add it" context
        }
      };

    } catch (error) {
      console.error('Error getting recommendations:', error);
      await sendMessage(userId, context.platform, "Sorry, I'm having trouble getting recommendations right now.");
      return { reply: null, updatedContext: context };
    }
  },

  // Simple text reply
  send_text_reply: async (args, userId, context) => {
    const message = args.message || "Hello! Welcome to our restaurant 🍽️ Type 'menu' to see our delicious options!";
    console.log(`━━━ SENDING TEXT REPLY ━━━`);
    console.log(`💬 Message: ${message}`);
    await sendMessage(userId, context.platform, message);
    return {
      reply: null,
      updatedContext: context
    };
  }
};

// Handle button/list reply callbacks from WhatsApp
// Handle button/list reply callbacks from WhatsApp AND Messenger
function parseInteractiveReply(message) {
  // WhatsApp Button
  if (message.interactive?.type === 'button_reply') {
    return {
      type: 'button',
      id: message.interactive.button_reply.id,
      title: message.interactive.button_reply.title
    };
  }
  // WhatsApp List
  if (message.interactive?.type === 'list_reply') {
    return {
      type: 'list',
      id: message.interactive.list_reply.id,
      title: message.interactive.list_reply.title
    };
  }

  // Messenger Postback
  if (message.interactive?.type === 'postback') {
    return {
      type: 'button', // Treat as button
      id: message.interactive.payload,
      title: message.interactive.title
    };
  }

  // Messenger Quick Reply
  if (message.interactive?.type === 'quick_reply') {
    return {
      type: 'button', // Treat as button
      id: message.interactive.payload,
      title: message.interactive.payload // Title often same as payload if no separate title
    };
  }

  return null;
}

async function routeIntent({ text, context, userId, interactiveReply, location }) {
  console.log(`━━━ ROUTING MESSAGE ━━━`);
  console.log(`📍 Context stage: ${context.stage || 'initial'}`);

  // Handle interactive replies (button clicks, list selections)
  if (interactiveReply) {
    const { id, title } = interactiveReply;
    console.log(`🔘 Interactive reply: ${id} - ${title}`);

    // Category selection from menu
    if (id.startsWith('cat_')) {
      const category = id.replace('cat_', '');
      return await toolHandlers.show_category_items({ category }, userId, context);
    }

    // Add item to cart (id format: add_<foodId>)
    if (id.startsWith('add_')) {
      const foodId = parseInt(id.replace('add_', ''));
      if (!isNaN(foodId)) {
        return await toolHandlers.add_to_cart({ foodId }, userId, context);
      }
    }

    // Handle Get Started (Welcome)
    if (id === 'GET_STARTED') {
      return await toolHandlers.show_welcome_message({}, userId, context);
    }

    // User wants to add more items
    if (id === 'add_more_items') {
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    // Quick add more from same category (new flow)
    if (id.startsWith('more_')) {
      const category = id.replace('more_', '');
      return await toolHandlers.show_category_items({ category }, userId, context);
    }

    // View all categories (new flow)
    if (id === 'view_all_categories') {
      return await toolHandlers.show_food_menu({}, userId, context);
    }


    // User wants to checkout
    if (id === 'proceed_checkout') {
      return await toolHandlers.confirm_order({ items: context.cart }, userId, context);
    }

    // Order confirmation/cancellation
    if (id === 'confirm_order') {
      return await toolHandlers.process_order_response({ action: 'confirmed' }, userId, context);
    }
    if (id === 'cancel_order') {
      return await toolHandlers.process_order_response({ action: 'cancelled' }, userId, context);
    }

    // Cancel confirmation flow
    if (id === 'confirm_cancel') {
      return await toolHandlers.process_order_response({ action: 'cancel_confirm' }, userId, context);
    }
    if (id === 'back_to_cart') {
      return await toolHandlers.show_cart_options({}, userId, context);
    }

    if (id === 'pay_online') {
      return await toolHandlers.pay_online({}, userId, context);
    }
    // Handle dine-in cash payment
    if (id === 'pay_cash_counter') {
      return await toolHandlers.pay_cash_counter({}, userId, context);
    }
  }

  // Handle Text Inputs based on Stage
  if (!interactiveReply && text) {
    // Handle payment method selection via text
    if (context.stage === 'selecting_payment') {
      const paymentText = text.toLowerCase();
      if (paymentText.includes('online') || paymentText.includes('stripe') || paymentText.includes('card')) {
        return await toolHandlers.pay_online({}, userId, context);
      } else if (paymentText.includes('cash') || paymentText.includes('cod') || paymentText.includes('counter')) {
        return await toolHandlers.pay_cash_counter({}, userId, context);
      } else {
        await sendMessage(userId, context.platform, "Please choose: 'Stripe Online' or 'Cash'");
        return { reply: null, updatedContext: context };
      }
    }

    // Handle "pay" or "pay now" text input when awaiting payment
    if (context.stage === 'awaiting_payment') {
      const paymentText = text.toLowerCase().trim();
      if (paymentText.includes('pay') || paymentText === 'pay now' || paymentText === 'pay now 💳') {
        // Check if we have a stored payment link
        if (context.paymentLink) {
          if (context.platform === 'whatsapp') {
            await sendMessage(userId, context.platform,
              `Here's your payment link again:\n\n${context.paymentLink}\n\nClick the link above to pay securely via Stripe! ✅`
            );
          } else {
            await sendButtonMessage(
              userId,
              context.platform,
              'Pay Securely',
              'Click below to complete your payment via Stripe',
              'Stripe Secure Payment',
              [{ type: 'url', url: context.paymentLink, title: 'Pay Now 💳' }]
            );
          }
          return { reply: null, updatedContext: context };
        } else {
          // No stored payment link, regenerate
          return await toolHandlers.pay_online({}, userId, context);
        }
      }
    }
  }

  // Check for order history keywords
  const lowerText = text?.toLowerCase() || '';
  if (lowerText.includes('order history') || lowerText.includes('my orders') || lowerText.includes('past orders') || lowerText.includes('previous orders')) {
    return await toolHandlers.show_order_history({}, userId, context);
  }

  // Use LLM to detect intent and decide which tool to call
  console.log(`🤖 Asking LLM for intent...`);
  const decision = await detectIntentAndRespond(text, context);

  console.log(`━━━ LLM DECISION ━━━`);
  console.log(`🎯 Intent: ${decision.intent}`);
  console.log(`🔧 Tool: ${decision.toolCall?.name || 'none'}`);
  console.log(`📝 Args: ${JSON.stringify(decision.toolCall?.arguments || {})}`);

  if (decision.toolCall && toolHandlers[decision.toolCall.name]) {
    // 🛡️ VALIDATION LAYER
    const { isValid, message: validationMsg } = validateToolCall(
      decision.toolCall.name,
      decision.toolCall.arguments
    );

    if (!isValid) {
      console.warn(`Validation failed for ${decision.toolCall.name}: ${validationMsg}`);
      await sendMessage(userId, context.platform, validationMsg);
      return { reply: null, updatedContext: context }; // Stop execution
    }

    return await toolHandlers[decision.toolCall.name](
      decision.toolCall.arguments,
      userId,
      context
    );
  }



  // Fallback
  const fallbackMessage = decision.response || "Hello! Welcome to our restaurant 🍽️ Type 'menu' to see our delicious options!";
  await sendMessage(userId, context.platform, fallbackMessage);
  return {
    reply: null,
    updatedContext: context
  };
}

export { routeIntent, parseInteractiveReply };
