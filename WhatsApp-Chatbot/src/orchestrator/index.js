import { getContext, updateContext } from './context.js';
import { routeIntent, parseInteractiveReply } from './router.js';
import { sendReply } from '../services/reply.js';

async function handleIncomingMessage(message) {
  const userId = message.userId;
  let context = await getContext(userId);

  // Ensure platform is stored in context
  if (message.platform && context.platform !== message.platform) {
    context.platform = message.platform;
  }

  // Store Business ID in context (Multi-tenant support)
  // This allows us to know which restaurant the user is interacting with
  if (message.businessId && context.businessId !== message.businessId) {
    context.businessId = message.businessId;
  }

  if (message.restaurantId) {
    if (context.restaurantId !== message.restaurantId) {
      console.log(`🏢 Switching context to Restaurant ID: ${message.restaurantId}`);
      context.restaurantId = message.restaurantId;
    }
    // Also update name if available
    if (message.restaurantName) {
      context.restaurantName = message.restaurantName;
    }

    // Persist immediately
    await updateContext(userId, context);
  } else if (!context.restaurantId) {
    // Fallback: If no restaurantId in message OR context, try to resolve one last time (or default)
    // For now, let's assume webhooks are doing their job.
    // Ideally we might want to throw or log strict warning here.
    console.warn(`⚠️ No Restaurant ID in context for user ${userId}`);
  }

  // Check for interactive reply (button click or list selection)
  const interactiveReply = parseInteractiveReply(message);

  // Add USER message to history
  const history = context.history || [];
  let userContent = message.text;

  if (message.catalogOrder) {
    userContent = `[Sent Catalog Cart with ${message.catalogOrder.items.length} items]`;
  } else if (interactiveReply) {
    userContent = `[Selected: ${interactiveReply.title}]`;
  } else if (!message.text) {
    userContent = '[Media/Other]';
  }

  history.push({ role: 'user', content: userContent });

  // Keep last 10 messages
  if (history.length > 10) history.shift();

  const decision = await routeIntent({
    text: message.text,
    context,
    userId,
    interactiveReply,
    catalogOrder: message.catalogOrder, // Pass catalog order details
    location: message.location
  });

  // Add ASSISTANT message to history (if text reply)
  if (decision.reply) {
    history.push({ role: 'assistant', content: decision.reply });
    if (history.length > 10) history.shift();
  } else if (decision.updatedContext && decision.updatedContext.lastAction) {
    // If tool execution without direct text reply (e.g. showing a menu), log it as system action
    history.push({ role: 'system', content: `Tool executed: ${decision.updatedContext.lastAction}` });
    if (history.length > 10) history.shift();
  }

  await updateContext(userId, { ...decision.updatedContext, history });

  // Only send reply if there's one (interactive messages handle their own replies)
  if (decision.reply) {
    await sendReply(message.platform, userId, decision.reply);
  }
}

export { handleIncomingMessage };
