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

import { OWNER_MENU_ITEMS, OWNER_NAV_GROUPS } from '../src/lib/owner-navigation.ts';

test('owner navigation uses clear, consistent groups', () => {
  assert.deepEqual(OWNER_NAV_GROUPS.map((group) => group.label), [
    'Platform', 'People & Data', 'Trust & Security', 'Infrastructure'
  ]);
});

test('every owner section appears exactly once in the navigation', () => {
  const ids = OWNER_MENU_ITEMS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 24);
  assert.ok(ids.includes('overview'));
  assert.ok(ids.includes('models'));
  assert.ok(ids.includes('users'));
  assert.ok(ids.includes('usage'));
  assert.ok(ids.includes('security'));
  assert.ok(ids.includes('owner-settings'));
});

test('navigation groups only contain items assigned to that group', () => {
  for (const group of OWNER_NAV_GROUPS) {
    assert.ok(group.items.length > 0, `${group.label} must not be empty`);
    for (const item of group.items) assert.equal(item.group, group.label);
  }
});

test('owner console header does not fall back to a hard-coded personal email', () => {
  const ownerPagePath = fileURLToPath(new URL('../src/pages/OwnerPage.tsx', import.meta.url));
  const ownerPage = readFileSync(ownerPagePath, 'utf8');
  assert.doesNotMatch(ownerPage, /dannyyoungofficial1@gmail\.com/);
});


test('chat shows the signed-in email and account avatar when available', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /user\.email/);
  assert.match(assistantPage, /user\.avatarUrl/);
  assert.match(assistantPage, /referrerPolicy="no-referrer"/);
  assert.match(assistantPage, /onError=\{\(event\) => \{ event\.currentTarget\.style\.display = 'none'; \}\}/);
});

test('chat message bubbles use readable mobile-first typography', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /text-\[14px\] font-normal text-zinc-100/);
  assert.match(assistantPage, /sm:text-\[15px\]/);
});
