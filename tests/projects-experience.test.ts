import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('Projects is a first-class workspace destination', () => {
  const navigation = read('../src/lib/workspace-navigation.ts');
  const shell = read('../src/components/workspace-shell.tsx');
  assert.match(navigation, /id: 'projects', label: 'Projects', to: '\/assistant\?view=projects'/);
  assert.match(shell, /id: 'projects', label: 'Projects', to: '\/assistant\?view=projects'/);
});

test('project management supports private creation, editing, and assigning existing chats', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(assistant, /function ProjectsView\(/);
  assert.match(assistant, /\.from\('projects'\)/);
  assert.match(assistant, /\.from\('conversations'\)/);
  assert.match(assistant, /project_id: selectedProjectId/);
  assert.match(assistant, /Project instructions/);
});

test('project conversations are linked in the database and remain owner-scoped', () => {
  const migration = read('../supabase/migrations/20261128100000_add_project_chat_link.sql');
  const stream = read('../api/chat/stream.ts');
  const store = read('../api/_lib/chat-store.ts');
  assert.match(migration, /foreign key \(project_id, user_id\)/);
  assert.match(migration, /on delete set null \(project_id\)/i);
  assert.match(stream, /\.eq\('user_id', user\.id\)/);
  assert.match(stream, /projectInstructions/);
  assert.match(store, /project_id/);
});

test('project chat links preserve project context when reopening a conversation', () => {
  const shell = read('../src/components/workspace-shell.tsx');
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(shell, /projectChat=.*project_id/);
  assert.match(assistant, /projectId: activeProjectId/);
});
