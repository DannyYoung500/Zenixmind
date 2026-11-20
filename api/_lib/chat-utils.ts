export function createConversationTitle(prompt: string): string {
  const title = String(prompt || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return title || 'New conversation';
}
