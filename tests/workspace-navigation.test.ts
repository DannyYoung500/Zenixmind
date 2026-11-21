import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WORKSPACE_NAVIGATION } from '../src/lib/workspace-navigation.ts';

test('workspace navigation contains only the four primary product destinations', () => {
  assert.deepEqual(
    WORKSPACE_NAVIGATION.map(({ id, label, to }) => ({ id, label, to })),
    [
      { id: 'chat', label: 'Chat', to: '/assistant' },
      { id: 'images', label: 'Imagine', to: '/assistant?view=images' },
      { id: 'library', label: 'My stuff', to: '/assistant?view=library' },
      { id: 'automations', label: 'Automations', to: '/assistant?view=automations' }
    ]
  );
});

test('primary navigation has no decorative badges or coming-soon labels', () => {
  assert.equal(WORKSPACE_NAVIGATION.some((item) => 'badge' in item), false);
  assert.equal(WORKSPACE_NAVIGATION.some((item) => /coming soon|beta|superuser/i.test(item.label)), false);
});

test('profile menu does not expose the Voice Assistant destination', () => {
  const workspaceShellPath = fileURLToPath(new URL('../src/components/workspace-shell.tsx', import.meta.url));
  const workspaceShell = readFileSync(workspaceShellPath, 'utf8');
  assert.doesNotMatch(workspaceShell, /to=["']\/assistant\/voice["']/);
  assert.doesNotMatch(workspaceShell, />\s*Voice Assistant\s*</);
});

test('workspace shell does not expose project creation or project navigation', () => {
  const workspaceShellPath = fileURLToPath(new URL('../src/components/workspace-shell.tsx', import.meta.url));
  const workspaceShell = readFileSync(workspaceShellPath, 'utf8');
  assert.doesNotMatch(workspaceShell, /Create New Project|Create your first project|title="Create project"/);
  assert.doesNotMatch(workspaceShell, /\.from\(['"]projects['"]\)|showAddProjectModal|handleAddProject/);
  assert.doesNotMatch(workspaceShell, /\/\* Projects Section \*\//);
});

test('assistant message reactions use restrained selected states', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.ok(assistantPage.includes("liked ? 'bg-white/[.08] text-white border border-white/[.12]'"));
  assert.ok(assistantPage.includes("disliked ? 'bg-rose-500/[.08] text-rose-300 border-rose-400/20'"));
  assert.match(assistantPage, /aria-pressed=\{liked\}/);
  assert.match(assistantPage, /aria-pressed=\{disliked\}/);
});

test('chat dictation microphone has a clear neutral idle state and accessible listening state', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.ok(assistantPage.includes("bg-[#151518] border-white/[.1] text-zinc-300 hover:bg-[#202024] hover:border-white/[.18] hover:text-white"));
  assert.ok(assistantPage.includes("bg-rose-500/[.12] border-rose-400/30 text-rose-300"));
  assert.match(assistantPage, /aria-label=\{isListening \? 'Stop voice dictation' : 'Start voice dictation'\}/);
});
