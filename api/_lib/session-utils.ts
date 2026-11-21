import { randomUUID } from 'node:crypto';

export function createScopedSessionId(userId: string, clientSessionId: string): string {
  const ownerId = String(userId || '').trim();
  if (!ownerId) throw new Error('User ID is required to scope a session.');
  const clientId = String(clientSessionId || '').trim().slice(0, 80) || randomUUID();
  return `${ownerId}:${clientId}`;
}
