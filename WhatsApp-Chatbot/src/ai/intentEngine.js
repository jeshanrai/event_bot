import { groq } from './groqClient.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { availableTools } from './tools.js';
import { AI_CONFIG } from './config.js';
import { logLLMCall } from '../utils/logLLMUsage.js';

/**
 * Takes user message text and conversation context, returns tool call decision
 */
export async function detectIntentAndRespond(userMessage, conversationContext = {}) {
  const systemPrompt = SYSTEM_PROMPT.replace('{{CONTEXT_STATE}}', JSON.stringify(conversationContext));

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationContext.history || []).map(msg => ({ role: msg.role === 'system' ? 'system' : (msg.role === 'user' ? 'user' : 'assistant'), content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) })),
    { role: "user", content: `User message: "${userMessage}"` }
  ];

  // Helper function to call LLM
  async function callLLM(msgs) {
    return await groq().chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      messages: msgs,
      tools: availableTools,
      tool_choice: AI_CONFIG.tool_choice
    });
  }

  try {
    let completion = await callLLM(messages);
    let message = completion.choices[0].message;

    // Log LLM usage
    const platform = conversationContext?.platform || 'web';
    await logLLMCall(platform);

    // Retry logic for JSON errors
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];

      try {
        const args = JSON.parse(toolCall.function.arguments || '{}');

        // Hallucination Check: Validate tool name
        const isValidTool = availableTools.some(t => t.function.name === toolCall.function.name);
        if (!isValidTool) {
          console.warn(`Hallucinated tool: ${toolCall.function.name}`);
          return {
            intent: "send_text_reply",
            toolCall: {
              name: "send_text_reply",
              arguments: { message: "I'm sorry, I encountered an internal error. Could you please rephrase that?" }
            },
            response: "I'm sorry, I encountered an internal error. Could you please rephrase that?"
          };
        }

        return {
          intent: toolCall.function.name,
          toolCall: {
            name: toolCall.function.name,
            arguments: args
          },
          response: message.content || ""
        };

      } catch (jsonError) {
        console.warn('JSON parse error, retrying...', jsonError);

        // Add error to history and retry ONCE
        const retryMessages = [
          ...messages,
          message, // The invalid assistant response
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: "Error: Invalid JSON format in arguments. Please regenerate with valid JSON."
          }
        ];

        try {
          completion = await callLLM(retryMessages);
          message = completion.choices[0].message;

          // Log retry LLM usage
          const platform = conversationContext?.platform || 'web';
          await logLLMCall(platform);

          if (message.tool_calls && message.tool_calls.length > 0) {
            const retryToolCall = message.tool_calls[0];
            // If it fails again, it will go to outer catch
            return {
              intent: retryToolCall.function.name,
              toolCall: {
                name: retryToolCall.function.name,
                arguments: JSON.parse(retryToolCall.function.arguments || '{}')
              },
              response: message.content || ""
            };
          }
        } catch (retryErr) {
          console.warn('Retry failed, falling back to text:', retryErr.message);
          // If retry fails, just use text response
          return {
            intent: "send_text_reply",
            toolCall: {
              name: "send_text_reply",
              arguments: { message: message.content || "I'm having trouble processing that. Could you try again?" }
            },
            response: message.content || "I'm having trouble processing that. Could you try again?"
          };
        }
      }
    }

    // Fallback to text response
    return {
      intent: "send_text_reply",
      toolCall: {
        name: "send_text_reply",
        arguments: { message: message.content || "How can I help you today?" }
      },
      response: message.content || "How can I help you today?"
    };

  } catch (err) {
    console.error('Intent detection error:', err);
    
    // Special handling for tool_use_failed errors
    if (err.status === 400 && err.error?.code === 'tool_use_failed') {
      console.warn('Tool use failed from Groq API, providing fallback...');
      
      // Extract context from the conversation
      const { stage } = conversationContext || {};
      const msgLower = userMessage.toLowerCase();
      
      // Heuristic handling for common confirmation scenarios
      if ((stage === 'confirming_order' || stage === 'confirming_deposit') && 
          (msgLower.includes('confirm') || msgLower.includes('yes') || msgLower.includes('ok'))) {
        return {
          intent: "process_order_response",
          toolCall: {
            name: "process_order_response",
            arguments: { action: "confirmed" }
          },
          response: ""
        };
      }
      
      if (msgLower.includes('cancel') || msgLower.includes('no')) {
        return {
          intent: "process_order_response",
          toolCall: {
            name: "process_order_response",
            arguments: { action: "cancelled" }
          },
          response: ""
        };
      }
    }
    
    return {
      intent: "send_text_reply",
      toolCall: {
        name: "send_text_reply",
        arguments: { message: "Sorry, I'm having trouble understanding. Could you try again?" }
      },
      response: "Sorry, I'm having trouble understanding. Could you try again?"
    };
  }
}

export { availableTools };
