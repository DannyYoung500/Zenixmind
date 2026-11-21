import test from 'node:test';
import assert from 'node:assert/strict';
import { WORKSPACE_NAVIGATION } from '../src/lib/workspace-navigation.ts';

test('workspace navigation contains only the four primary product destinations', () => {
  assert.deepEqual(
    WORKSPACE_NAVIGATION.map(({ id, label, to }) => ({ id, label, to })),
    [
      { id: 'chat', label: 'Chat', to: '/assistant' },
      { id: 'images', label: 'Imagine', to: '/assistant?view=images' },
      { id: 'library', label: 'Library', to: '/assistant?view=library' },
      { id: 'automations', label: 'Automations', to: '/assistant?view=automations' }
    ]
  );
});

test('primary navigation has no decorative badges or coming-soon labels', () => {
  assert.equal(WORKSPACE_NAVIGATION.some((item) => 'badge' in item), false);
  assert.equal(WORKSPACE_NAVIGATION.some((item) => /coming soon|beta|superuser/i.test(item.label)), false);
});
