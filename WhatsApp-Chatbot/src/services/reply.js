import { sendMessage } from './response.js';

async function sendReply(platform, userId, text, options = {}) {
  await sendMessage(userId, platform, text, options);
}

export { sendReply };
