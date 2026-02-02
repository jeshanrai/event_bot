import { getContext, updateContext } from "./context.js";
import { routeIntent, parseInteractiveReply } from "./router.js";
import { sendReply } from "../services/reply.js";
import { sendButtonMessage, sendMessage } from "../services/response.js";

async function handleIncomingMessage(message) {
  const userId = message.userId;
  let context = await getContext(userId);

  // Track if context was modified
  let contextModified = false;

  // Ensure platform is stored in context
  if (message.platform && context.platform !== message.platform) {
    context.platform = message.platform;
    contextModified = true;
  }

  // Store Business ID in context (Multi-tenant support)
  if (message.businessId && context.businessId !== message.businessId) {
    context.businessId = message.businessId;
    contextModified = true;
  }

  // Store Restaurant info
  if (message.restaurantId && context.restaurantId !== message.restaurantId) {
    console.log(
      `🏢 Switching context to Restaurant ID: ${message.restaurantId}`,
    );
    context.restaurantId = message.restaurantId;
    contextModified = true;
  }

  if (
    message.restaurantName &&
    context.restaurantName !== message.restaurantName
  ) {
    context.restaurantName = message.restaurantName;
    contextModified = true;
  }

  // ⭐ PERSIST CONTEXT IMMEDIATELY if any tenant/platform info changed
  if (contextModified) {
    await updateContext(userId, context);
    console.log(
      `✅ Context updated with businessId: ${context.businessId}, restaurantId: ${context.restaurantId}`,
    );
  }

  // Validate we have necessary info
  if (!context.restaurantId) {
    console.warn(`⚠️ No Restaurant ID in context for user ${userId}`);
  }

  // Check for interactive reply (button click or list selection)
  const interactiveReply = parseInteractiveReply(message);

  // --- AGE VERIFICATION CHECK ---
  const isAgeResponse =
    interactiveReply &&
    (interactiveReply.id === "age_verified_yes" ||
      interactiveReply.id === "age_verified_no");

  if (!context.age_verified && !isAgeResponse && !context.isAdmin) {
    console.log(
      `🔒 User ${userId} not age verified. Sending prompt with businessId: ${context.businessId}`,
    );

    await sendButtonMessage(
      userId,
      context.platform,
      "🔞 Age Verification Required",
      "This service includes age-restricted content and products (alcohol).\n\n*Are you 18 years old or above?*",
      "Please confirm your age",
      [
        {
          type: "reply",
          reply: { id: "age_verified_yes", title: "✅ I am 18+" },
        },
        {
          type: "reply",
          reply: { id: "age_verified_no", title: "❌ I am under 18" },
        },
      ],
      { businessId: context.businessId },
    );

    return; // STOP PROCESSING
  }

  // Add USER message to history
  const history = context.history || [];
  let userContent = message.text;

  if (message.catalogOrder) {
    userContent = `[Sent Catalog Cart with ${message.catalogOrder.items.length} items]`;
  } else if (interactiveReply) {
    userContent = `[Selected: ${interactiveReply.title}]`;
  } else if (!message.text) {
    userContent = "[Media/Other]";
  }

  // Deduplicate: If the last message in history is identical to this one (and very recent), skip adding it
  // This helps prevent "echo" loops if webhooks fire multiple times
  const lastMsg = history.length > 0 ? history[history.length - 1] : null;
  const isDuplicate =
    lastMsg && lastMsg.role === "user" && lastMsg.content === userContent;

  if (!isDuplicate) {
    history.push({ role: "user", content: userContent });
    // Keep last 10 messages
    if (history.length > 10) history.shift();
  }

  const decision = await routeIntent({
    text: message.text,
    context,
    userId,
    interactiveReply,
    catalogOrder: message.catalogOrder, // Pass catalog order details
    location: message.location,
  });

  // Add ASSISTANT message to history (if text reply)
  if (decision.reply) {
    history.push({ role: "assistant", content: decision.reply });
    if (history.length > 10) history.shift();
  } else if (decision.updatedContext && decision.updatedContext.lastAction) {
    // If tool execution without direct text reply (e.g. showing a menu), log it as system action
    history.push({
      role: "system",
      content: `Tool executed: ${decision.updatedContext.lastAction}`,
    });
    if (history.length > 10) history.shift();
  }

  await updateContext(userId, { ...decision.updatedContext, history });

  // Only send reply if there's one (interactive messages handle their own replies)
  if (decision.reply) {
    const replyOptions = {
      businessId: decision.updatedContext?.businessId || context.businessId,
    };
    await sendReply(message.platform, userId, decision.reply, replyOptions);
  }
}

export { handleIncomingMessage };
