import fetch from "node-fetch";
import TenantResolver from "../utils/tenant.js";
import { momoImages } from "../assets/momoImages.js";

function logFinalResponse(to, type, content) {
  console.log("\n✅ [FINAL RESPONSE MESSAGE]");
  console.log(`🎯 User ID: ${to}`);
  console.log(`📝 Type: ${type}`);
  console.log(`📤 Content: ${content}`);
  console.log("━".repeat(50));
}

export async function sendWhatsAppImageMessage(
  to,
  imageUrl,
  caption,
  options = {},
) {
  logFinalResponse(to, "Image", caption ? `[Image] ${caption}` : "[Image]");

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "image",
    image: {
      link: imageUrl,
      caption: caption,
    },
  };

  console.log("📷 [WhatsApp Image Message]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log("Image message sent successfully:", result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp image message:", error);
  }
}

// Send interactive button message
export async function sendWhatsAppButtonMessage(
  to,
  headerText,
  bodyText,
  footerText,
  buttons,
  options = {},
) {
  logFinalResponse(
    to,
    "Button Message",
    `${headerText ? `[Header: ${headerText}]\n` : ""}${bodyText}\n[Buttons: ${buttons.map((b) => b.reply.title).join(", ")}]`,
  );

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "button",
      header: {
        type: "text",
        text: headerText,
      },
      body: {
        text: bodyText,
      },
      footer: {
        text: footerText,
      },
      action: {
        buttons: buttons,
      },
    },
  };

  console.log("🔘 [WhatsApp Button Message]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log("Button message sent successfully:", result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp button message:", error);
  }
}

// Send order confirmation message with Confirm and Cancel buttons
export async function sendOrderConfirmationMessage(
  to,
  orderDetails,
  options = {},
) {
  const buttons = [
    {
      type: "reply",
      reply: {
        id: "confirm_order",
        title: "Confirm Order ✅",
      },
    },
    {
      type: "reply",
      reply: {
        id: "cancel_order",
        title: "Cancel Order ❌",
      },
    },
  ];

  const bodyText = `📋 Order Summary:\n${orderDetails}\n\nPlease confirm your order or cancel if you'd like to make changes.`;

  return sendWhatsAppButtonMessage(
    to,
    "🛒 Confirm Your Order",
    bodyText,
    "Thank you for ordering with Momo House!",
    buttons,
    options,
  );
}

export async function sendWhatsAppCarouselMessage(
  to,
  bodyText,
  cards,
  options = {},
) {
  logFinalResponse(to, "Carousel Message", bodyText);

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "carousel",
      body: {
        text: bodyText,
      },
      action: {
        cards: cards,
      },
    },
  };

  console.log(
    "🎠 [WhatsApp Carousel Message]",
    JSON.stringify(payload, null, 2),
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log(
      "Carousel message sent successfully:",
      result.messages?.[0]?.id,
    );
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp carousel message:", error);
  }
}

export async function sendWhatsAppListMessage(
  to,
  header,
  body,
  footer,
  buttonText,
  sections,
  options = {},
) {
  logFinalResponse(
    to,
    "List Message",
    `${header ? `[Header: ${header}]\n` : ""}${body}\n[Button: ${buttonText}]`,
  );

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // Sanitize sections: WhatsApp list rows only support id, title, description
  // Remove any unsupported fields like imageUrl
  const sanitizedSections = sections.map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => ({
      id: row.id,
      title: row.title?.substring(0, 24) || "Item", // WhatsApp limit: 24 chars
      description: row.description?.substring(0, 72) || "", // WhatsApp limit: 72 chars
    })),
  }));

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: header,
      },
      body: {
        text: body,
      },
      footer: {
        text: footer,
      },
      action: {
        button: buttonText,
        sections: sanitizedSections,
      },
    },
  };

  console.log("📋 [WhatsApp List Message]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log("List message sent successfully:", result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp list message:", error);
  }
}

export async function sendWhatsAppMessage(to, text, options = {}) {
  logFinalResponse(to, "Text Message", text);

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: text },
  };

  console.log("💬 [WhatsApp Text Message]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log("Message sent successfully:", result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
  }
}

/**
 * Send a location request message (WhatsApp native location sharing)
 * When user taps the button, they can share their GPS location
 */
/**
 * Send a CTA URL button message (opens webpage/webview)
 * Used for sending menu webview links
 */
export async function sendWhatsAppCtaUrlButton(
  to,
  headerText,
  bodyText,
  footerText,
  buttonText,
  url,
  options = {},
) {
  console.log("\n✅ [FINAL RESPONSE MESSAGE]");
  console.log(`🎯 User ID: ${to}`);
  console.log(`📝 Type: CTA URL Button`);
  console.log(`📤 URL: ${url}`);
  console.log("━".repeat(50));

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const urlObj = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      header: {
        type: "text",
        text: headerText,
      },
      body: {
        text: bodyText,
      },
      footer: {
        text: footerText,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: buttonText,
          url: url,
        },
      },
    },
  };

  console.log("🔗 [WhatsApp CTA URL Button]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(urlObj, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log("CTA URL button sent successfully:", result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp CTA URL button:", error);
  }
}

export async function sendWhatsAppLocationRequest(to, bodyText, options = {}) {
  console.log("\n✅ [FINAL RESPONSE MESSAGE]");
  console.log(`🎯 User ID: ${to}`);
  console.log(`📝 Type: Location Request`);
  console.log(`📤 Content: ${bodyText}`);
  console.log("━".repeat(50));

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (options.businessId) {
    const credentials = await TenantResolver.getWhatsAppCredentials(
      options.businessId,
    );
    if (credentials) {
      phoneNumberId = credentials.phoneNumberId; // ✅ CORRECT: Use phoneNumberId from DB
      accessToken = credentials.accessToken;
      console.log(
        `✅ Using DB credentials - Phone Number ID: ${phoneNumberId}`,
      );
    } else {
      console.log(`⚠️ No DB credentials found, using .env`);
    }
  }

  if (!phoneNumberId || !accessToken) {
    console.error(
      "Missing WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)",
    );
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "location_request_message",
      body: {
        text: bodyText,
      },
      action: {
        name: "send_location",
      },
    },
  };

  console.log(
    "📍 [WhatsApp Location Request]",
    JSON.stringify(payload, null, 2),
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return;
    }

    const result = await response.json();
    console.log(
      "Location request sent successfully:",
      result.messages?.[0]?.id,
    );
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp location request:", error);
  }
}
