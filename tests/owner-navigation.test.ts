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


test('workspace account area shows the signed-in email and profile image when available', () => {
  const workspaceShellPath = fileURLToPath(new URL('../src/components/workspace-shell.tsx', import.meta.url));
  const workspaceShell = readFileSync(workspaceShellPath, 'utf8');
  assert.match(workspaceShell, /user\.email/);
  assert.match(workspaceShell, /user\.avatarUrl/);
  assert.match(workspaceShell, /referrerPolicy="no-referrer"/);
  assert.match(workspaceShell, /onError=\{\(event\) => \{ event\.currentTarget\.style\.display = 'none'; \}\}/);
});

test('chat uses a premium empty state and readable mobile-first message typography', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /What would you like to work on\?/);
  assert.match(assistantPage, /Build an app/);
  assert.match(assistantPage, /A few ways to get started/);
  assert.doesNotMatch(assistantPage, /Select Model/);
  assert.doesNotMatch(assistantPage, /Zenix 4\.6 Fast/);
  assert.match(assistantPage, /text-\[14px\] font-normal leading-7 text-zinc-100/);
  assert.match(assistantPage, /sm:text-\[16px\]/);
});

test('workspace shell keeps a responsive navigation, recent chats and account footer', () => {
  const workspaceShellPath = fileURLToPath(new URL('../src/components/workspace-shell.tsx', import.meta.url));
  const workspaceShell = readFileSync(workspaceShellPath, 'utf8');
  assert.match(workspaceShell, /h-\[100dvh\] overflow-hidden/);
  assert.match(workspaceShell, /flex min-h-0 flex-1 flex-col overflow-hidden/);
  assert.match(workspaceShell, /Recent conversations/);
  assert.match(workspaceShell, /aria-label="Open navigation"/);
  assert.match(workspaceShell, /Workspace navigation/);
});

test('assistant feedback uses a focused issue-and-details sheet instead of inline chips', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /Share feedback/);
  assert.match(assistantPage, /response-feedback-type/);
  assert.match(assistantPage, /Share details \(optional\)/);
  assert.match(assistantPage, /Thank you for your feedback/);
  assert.doesNotMatch(assistantPage, /What went wrong\?/);
});

test('mobile composer offers separate camera, photos, files, plugins status, and think-harder controls', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /capture="environment"/);
  assert.match(assistantPage, />Camera</);
  assert.match(assistantPage, />Photos</);
  assert.match(assistantPage, />Files</);
  assert.match(assistantPage, /Plugins/);
  assert.match(assistantPage, /Think harder/);
});

test('feedback sheet supports keyboard dismissal, focus management, and mobile safe areas', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /event\.key === 'Escape'/);
  assert.match(assistantPage, /feedbackDialogRef/);
  assert.match(assistantPage, /dislikeButtonRef\.current\?\.focus\(\)/);
  assert.match(assistantPage, /env\(safe-area-inset-bottom\)/);
  assert.match(assistantPage, /aria-describedby="response-feedback-description"/);
});

test('composer file inputs reset after selection so the same file can be attached again', () => {
  const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
  const assistantPage = readFileSync(assistantPagePath, 'utf8');
  assert.match(assistantPage, /e\.currentTarget\.value = ''/);
});
