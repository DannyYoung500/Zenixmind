import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAutomationExpression, formatAutomationSchedule } from '../api/_lib/automation-schedule.ts';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('automation schedules produce timezone-aware daily, weekly, and monthly cron expressions', () => {
  assert.deepEqual(buildAutomationExpression({ frequency: 'daily', time: '08:05', timezone: 'Africa/Lagos' }), {
    expression: { type: 'cron', cron: '5 8 * * *' }, cronExpression: '5 8 * * *', runAt: null
  });
  assert.equal(buildAutomationExpression({ frequency: 'weekly', time: '09:30', weekday: 1, timezone: 'Africa/Lagos' }).cronExpression, '30 9 * * 1');
  assert.equal(buildAutomationExpression({ frequency: 'monthly', time: '06:00', monthDay: 12, timezone: 'Africa/Lagos' }).cronExpression, '0 6 12 * *');
});

test('one-time automation requires a future local date and time', () => {
  const now = new Date('2026-11-28T00:00:00.000Z');
  const result = buildAutomationExpression({ frequency: 'once', runAt: '2026-11-28T03:00', timezone: 'Africa/Lagos' }, now);
  assert.deepEqual(result.expression, { type: 'single', at: '2026-11-28T03:00' });
  assert.throws(() => buildAutomationExpression({ frequency: 'once', runAt: '2026-11-27T23:00', timezone: 'Africa/Lagos' }, now), /future/);
});

test('invalid schedule times and timezones are rejected', () => {
  assert.throws(() => buildAutomationExpression({ frequency: 'daily', time: '25:90', timezone: 'Africa/Lagos' }), /time/);
  assert.throws(() => buildAutomationExpression({ frequency: 'daily', time: '08:00', timezone: 'Mars/Olympus' }), /timezone/);
});

test('schedule labels are clear for each recurrence type', () => {
  assert.equal(formatAutomationSchedule({ frequency: 'daily', time: '08:00', timezone: 'Africa/Lagos' }), 'Daily at 08:00');
  assert.equal(formatAutomationSchedule({ frequency: 'weekly', time: '08:00', weekday: 1, timezone: 'Africa/Lagos' }), 'Every Monday at 08:00');
  assert.equal(formatAutomationSchedule({ frequency: 'monthly', time: '08:00', monthDay: 12, timezone: 'Africa/Lagos' }), 'Monthly on day 12 at 08:00');
  assert.equal(formatAutomationSchedule({ frequency: 'once', runAt: '2026-12-01T08:00', timezone: 'Africa/Lagos' }), 'Once · 2026-12-01 08:00');
});

test('Automations is backed by durable schedules, queue processing, and owner-scoped data', () => {
  const view = read('../src/pages/AssistantPage.tsx');
  const chatRouter = read('../api/chat.ts');
  const api = read('../api/_lib/automations-handler.ts');
  const worker = read('../api/_lib/automation-worker.ts');
  const queueConsumer = read('../api/status.ts');
  const config = read('../vercel.json');
  const migration = read('../supabase/migrations/20261128063235_create_automations_and_runs.sql');
  const completionMigration = read('../supabase/migrations/20261128063448_add_automation_completion_state.sql');
  const pkg = read('../package.json');
  assert.match(view, /function AutomationsView\(\{ userId \}/);
  assert.match(view, /\/api\/chat\?action=automations/);
  assert.match(chatRouter, /handleAutomationsRequest/);
  assert.match(view, /Run now/);
  assert.match(view, /frequency === 'monthly'/);
  assert.match(view, /Run history/);
  assert.doesNotMatch(view, /Morning AI Briefing|Repository Architecture Audit|Grok 3/);
  assert.match(read('../api/_lib/zenix-system-prompt.ts'), /Automations let users create daily, weekly, monthly, or one-time AI tasks/);
  assert.match(api, /SchedulesClient/);
  assert.match(api, /getVercelOidcToken/);
  assert.match(api, /\.eq\('user_id', user\.id\)/);
  assert.match(api, /send\(AUTOMATION_TOPIC/);
  assert.match(queueConsumer, /handleNodeCallback/);
  assert.match(worker, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(worker, /automation_runs/);
  assert.match(worker, /\.eq\('user_id', userId\)/);
  assert.match(config, /queue\/v2beta/);
  assert.match(config, /zenixmind-automations/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /automation_runs_owner_fkey/);
  assert.match(completionMigration, /add column completed_at timestamptz/);
  assert.match(pkg, /"@vercel\/schedules": "0.0.3"/);
  assert.match(pkg, /"@vercel\/queue": "0.11.0"/);
  assert.match(pkg, /"@vercel\/oidc": "5.0.0"/);
});
