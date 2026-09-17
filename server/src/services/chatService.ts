import type { LeadNotifier } from './leadNotifier';

// Website chat backend. The widget talks to a ChatProvider; this scripted
// default answers common questions and hands the conversation to the team
// by email as soon as the visitor shares a phone number. Swap in a live-agent
// or AI provider later by returning a different implementation from
// createChatProvider — the widget and route stay unchanged.

export interface ChatMessage { role: 'visitor' | 'assistant'; text: string }
export interface ChatReply { text: string; handoff?: boolean }
export interface ChatProvider {
  reply(messages: ChatMessage[], meta: { sessionId: string }): Promise<ChatReply>;
}

const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

export function createChatProvider(notifier: LeadNotifier | null): ChatProvider {
  const notified = new Set<string>();
  return {
    async reply(messages, { sessionId }) {
      const last = messages.filter(m => m.role === 'visitor').pop()?.text || '';
      const lower = last.toLowerCase();
      const phone = last.match(PHONE)?.[0];
      if (phone) {
        if (notifier && !notified.has(sessionId)) {
          notified.add(sessionId);
          const transcript = messages.map(m => `${m.role === 'visitor' ? 'Visitor' : 'Hanson'}: ${m.text}`).join('\n');
          notifier.chatLead({ sessionId, phone, transcript }).catch(() => console.error('Chat handoff email failed.'));
        }
        return {
          text: 'Thank you! A Hanson Home specialist will call or text you within 1 business day. If it’s urgent, call or text us now at (401) 612-3443.',
          handoff: true,
        };
      }
      if (/(price|cost|quote|estimate|how much)/.test(lower)) {
        return { text: 'The best way to get an accurate price is our 2-minute quote request — we prepare a written, fixed all-in quote with no obligation. Tap “Get my quote” below, or leave your phone number here and we’ll call you.' };
      }
      if (/(rebate|mass ?save|incentive|discount)/.test(lower)) {
        return { text: 'Mass Save rebates can cover up to $8,500 for qualifying heat-pump projects. Eligibility depends on your utilities and home — leave your phone number and a specialist will walk you through it, or start a quote request and we’ll include a rebate review.' };
      }
      if (/(call|phone|talk|speak|human|person|agent)/.test(lower)) {
        return { text: 'Of course — call or text us at (401) 612-3443, or leave your number here and we’ll reach out within 1 business day.' };
      }
      return { text: 'Thanks for reaching out! A team member can help with that. Leave your phone number here and we’ll call you within 1 business day — or call/text (401) 612-3443 any time.' };
    },
  };
}
