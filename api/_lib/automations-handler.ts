import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getVercelOidcToken } from '@vercel/oidc';
import { send } from '@vercel/queue';
import { SchedulesClient } from '@vercel/schedules';
import { getChatContext } from './chat-store.ts';
import { buildAutomationExpression, formatAutomationSchedule } from './automation-schedule.ts';

const AUTOMATION_TOPIC = 'zenixmind-automations';

async function getSchedulesClient() {
  const token = await getVercelOidcToken();
  return new SchedulesClient({ token });
}

function toClientAutomation(task: any) {
  if (task.frequency === 'once') {
    return { ...task, schedule_label: formatAutomationSchedule({ frequency: 'once', runAt: task.run_at || '', timezone: task.timezone }) };
  }
  const parts = String(task.cron_expression || '0 8 * * *').split(' ');
  const minute = Number(parts[0] || 0);
  const hour = Number(parts[1] || 8);
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const weekday = task.frequency === 'weekly' ? Number(parts[4] || 1) : 1;
  const monthDay = task.frequency === 'monthly' ? Number(parts[2] || 1) : 1;
  return {
    ...task,
    schedule_label: formatAutomationSchedule({ frequency: task.frequency, time, weekday, monthDay, timezone: task.timezone })
  };
}

async function findAutomation(supabase: any, userId: string, id: string) {
  const { data, error } = await supabase.from('automations')
    .select('id,user_id,title,prompt,frequency,cron_expression,run_at,timezone,schedule_name,schedule_id,enabled,web_search,last_run_at,completed_at,created_at,updated_at')
    .eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function handleAutomationsRequest(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const context = await getChatContext(req.headers.authorization);
  if (!context) return res.status(401).json({ error: 'Sign in to manage scheduled tasks.', code: 'AUTH_REQUIRED' });
  const { user, supabase } = context;
  let body: any = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; }
  catch { return res.status(400).json({ error: 'Invalid request body.', code: 'INVALID_BODY' }); }

  if (req.method === 'GET') {
    const [tasksResult, runsResult] = await Promise.all([
      supabase.from('automations')
        .select('id,title,prompt,frequency,cron_expression,run_at,timezone,schedule_name,schedule_id,enabled,web_search,last_run_at,completed_at,created_at,updated_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('automation_runs')
        .select('id,automation_id,status,output,error,trigger_type,scheduled_at,started_at,completed_at,input_tokens,output_tokens,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
    ]);
    if (tasksResult.error || runsResult.error) return res.status(500).json({ error: 'Unable to load scheduled tasks.', code: 'AUTOMATIONS_LOAD_FAILED' });
    return res.status(200).json({ automations: (tasksResult.data || []).map(toClientAutomation), runs: runsResult.data || [] });
  }

  if (req.method === 'POST') {
    if (body.action === 'run') {
      const id = String(req.query.id || body.id || '').trim();
      if (!id) return res.status(400).json({ error: 'A scheduled task is required.', code: 'AUTOMATION_ID_REQUIRED' });
      let task: any;
      try { task = await findAutomation(supabase, user.id, id); }
      catch { return res.status(500).json({ error: 'Unable to load this scheduled task.', code: 'AUTOMATION_LOOKUP_FAILED' }); }
      if (!task) return res.status(404).json({ error: 'Scheduled task not found.', code: 'AUTOMATION_NOT_FOUND' });
      if (task.completed_at) return res.status(409).json({ error: 'This one-time task has already completed.', code: 'AUTOMATION_ALREADY_COMPLETED' });
      try {
        const queued = await send(AUTOMATION_TOPIC, { automationId: task.id, userId: user.id, manual: true }, { idempotencyKey: `manual-${task.id}-${Date.now()}` });
        return res.status(202).json({ queued: true, messageId: queued.messageId || null });
      } catch (error: any) {
        console.error('[automations] manual queue failed', error?.message || 'Queue unavailable');
        return res.status(503).json({ error: 'The task could not be queued. Check that Vercel Queues are enabled for this project.', code: 'AUTOMATION_QUEUE_UNAVAILABLE' });
      }
    }

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 4000) : '';
    if (!title || !prompt) return res.status(400).json({ error: 'Add a task name and instructions.', code: 'AUTOMATION_DETAILS_REQUIRED' });
    const { count, error: countError } = await supabase.from('automations').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (countError) return res.status(500).json({ error: 'Unable to check your scheduled task limit.', code: 'AUTOMATION_LIMIT_CHECK_FAILED' });
    if ((count || 0) >= 10) return res.status(429).json({ error: 'You can create up to 10 scheduled tasks. Delete one before adding another.', code: 'AUTOMATION_LIMIT_REACHED' });

    const frequency = body.frequency;
    const timezone = typeof body.timezone === 'string' ? body.timezone.trim() : 'UTC';
    let schedule;
    try {
      schedule = buildAutomationExpression({
        frequency,
        time: typeof body.time === 'string' ? body.time : '',
        weekday: Number(body.weekday),
        monthDay: Number(body.monthDay),
        runAt: typeof body.runAt === 'string' ? body.runAt : '',
        timezone
      });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Choose a valid schedule.', code: 'AUTOMATION_SCHEDULE_INVALID' });
    }

    const id = randomUUID();
    const scheduleName = `auto-${id}`;
    const { data: created, error: createError } = await supabase.from('automations').insert({
      id, user_id: user.id, title, prompt, frequency,
      cron_expression: schedule.cronExpression,
      run_at: schedule.runAt,
      timezone,
      schedule_name: scheduleName,
      enabled: true,
      web_search: body.webSearch === true
    }).select('id,title,prompt,frequency,cron_expression,run_at,timezone,schedule_name,schedule_id,enabled,web_search,last_run_at,completed_at,created_at,updated_at').single();
    if (createError || !created) {
      console.error('[automations] task insert failed', createError?.message || 'Unknown database error');
      return res.status(500).json({ error: 'Unable to save this scheduled task.', code: 'AUTOMATION_CREATE_FAILED' });
    }

    try {
      const schedules = await getSchedulesClient();
      const scheduled = await schedules.create({
        name: scheduleName,
        namespace: user.id,
        target: { topic: AUTOMATION_TOPIC },
        expression: schedule.expression,
        timezone,
        payload: { automationId: id, userId: user.id }
      });
      const { error: updateError } = await supabase.from('automations')
        .update({ schedule_id: scheduled.scheduleId, updated_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', user.id);
      if (updateError) {
        try { await schedules.delete({ name: scheduleName, namespace: user.id }); } catch {}
        await supabase.from('automations').delete().eq('id', id).eq('user_id', user.id);
        return res.status(500).json({ error: 'The schedule was created but could not be saved. Please try again.', code: 'AUTOMATION_SCHEDULE_SAVE_FAILED' });
      }
      return res.status(201).json({ automation: toClientAutomation({ ...created, schedule_id: scheduled.scheduleId }) });
    } catch (error: any) {
      await supabase.from('automations').delete().eq('id', id).eq('user_id', user.id);
      console.error('[automations] schedule creation failed', error?.message || 'Vercel Schedules unavailable');
      return res.status(503).json({ error: 'Vercel Schedules is not available for this deployment yet. Enable Schedules and Queues for the project, then try again.', code: 'AUTOMATION_SCHEDULES_UNAVAILABLE' });
    }
  }

  if (req.method === 'PATCH') {
    const id = String(req.query.id || body.id || '').trim();
    if (!id || typeof body.enabled !== 'boolean') return res.status(400).json({ error: 'A task and enabled state are required.', code: 'AUTOMATION_UPDATE_INVALID' });
    let task: any;
    try { task = await findAutomation(supabase, user.id, id); }
    catch { return res.status(500).json({ error: 'Unable to load this scheduled task.', code: 'AUTOMATION_LOOKUP_FAILED' }); }
    if (!task) return res.status(404).json({ error: 'Scheduled task not found.', code: 'AUTOMATION_NOT_FOUND' });
    if (task.completed_at && body.enabled) return res.status(409).json({ error: 'This one-time task has already completed.', code: 'AUTOMATION_ALREADY_COMPLETED' });
    try {
      const schedules = await getSchedulesClient();
      if (body.enabled) await schedules.enable({ name: task.schedule_name, namespace: user.id });
      else await schedules.disable({ name: task.schedule_name, namespace: user.id });
    } catch (error: any) {
      console.error('[automations] schedule toggle failed', error?.message || 'Vercel Schedules unavailable');
      return res.status(503).json({ error: 'The schedule could not be updated. Please try again.', code: 'AUTOMATION_TOGGLE_FAILED' });
    }
    const { data, error } = await supabase.from('automations')
      .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select('id,title,prompt,frequency,cron_expression,run_at,timezone,schedule_name,schedule_id,enabled,web_search,last_run_at,completed_at,created_at,updated_at')
      .single();
    if (error || !data) return res.status(500).json({ error: 'The schedule changed but its status could not be saved.', code: 'AUTOMATION_UPDATE_FAILED' });
    return res.status(200).json({ automation: toClientAutomation(data) });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'A scheduled task is required.', code: 'AUTOMATION_ID_REQUIRED' });
    let task: any;
    try { task = await findAutomation(supabase, user.id, id); }
    catch { return res.status(500).json({ error: 'Unable to load this scheduled task.', code: 'AUTOMATION_LOOKUP_FAILED' }); }
    if (!task) return res.status(404).json({ error: 'Scheduled task not found.', code: 'AUTOMATION_NOT_FOUND' });
    try {
      const schedules = await getSchedulesClient();
      await schedules.delete({ name: task.schedule_name, namespace: user.id });
    } catch (error: any) {
      const scheduleCode = String(error?.code || error?.message || '');
      const alreadyDispatchedOneTime = Boolean(task.completed_at) && (scheduleCode.includes('schedule_single_at_passed') || scheduleCode.includes('not_found'));
      if (!alreadyDispatchedOneTime) {
        console.error('[automations] schedule delete failed', error?.message || 'Vercel Schedules unavailable');
        return res.status(503).json({ error: 'The schedule could not be cancelled. The task was kept so it will not become an orphaned schedule.', code: 'AUTOMATION_DELETE_FAILED' });
      }
    }
    const { error } = await supabase.from('automations').delete().eq('id', id).eq('user_id', user.id);
    if (error) return res.status(500).json({ error: 'The schedule was cancelled but the task could not be deleted.', code: 'AUTOMATION_DELETE_FAILED' });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
