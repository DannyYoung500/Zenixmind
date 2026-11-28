export type AutomationFrequency = 'daily' | 'weekly' | 'monthly' | 'once';

export type AutomationScheduleInput = {
  frequency: AutomationFrequency;
  time?: string;
  weekday?: number;
  monthDay?: number;
  runAt?: string;
  timezone: string;
};

export type AutomationScheduleExpression = {
  expression: { type: 'cron'; cron: string } | { type: 'single'; at: string };
  cronExpression: string | null;
  runAt: string | null;
};

function validateTimezone(timezone: string) {
  if (!timezone || timezone.length > 100) throw new Error('A valid timezone is required.');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error('Choose a valid IANA timezone.');
  }
}

function validateTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('Choose a valid time in 24-hour HH:MM format.');
  }
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function localDateTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function buildAutomationExpression(
  input: AutomationScheduleInput,
  now: Date = new Date()
): AutomationScheduleExpression {
  validateTimezone(input.timezone);

  if (input.frequency === 'once') {
    const runAt = input.runAt || '';
    if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(runAt)) {
      throw new Error('Choose a valid date and time for this one-time task.');
    }
    const [datePart] = runAt.split('T');
    const parsedDate = new Date(`${datePart}T00:00:00Z`);
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== datePart) {
      throw new Error('Choose a valid date for this one-time task.');
    }
    if (runAt <= localDateTime(now, input.timezone)) {
      throw new Error('The one-time run must be in the future.');
    }
    return { expression: { type: 'single', at: runAt }, cronExpression: null, runAt };
  }

  const { hour, minute } = validateTime(input.time || '');
  if (input.frequency === 'daily') {
    const cron = `${minute} ${hour} * * *`;
    return { expression: { type: 'cron', cron }, cronExpression: cron, runAt: null };
  }
  if (input.frequency === 'weekly') {
    const weekday = Number(input.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new Error('Choose a valid weekday.');
    }
    const cron = `${minute} ${hour} * * ${weekday}`;
    return { expression: { type: 'cron', cron }, cronExpression: cron, runAt: null };
  }
  if (input.frequency === 'monthly') {
    const monthDay = Number(input.monthDay);
    if (!Number.isInteger(monthDay) || monthDay < 1 || monthDay > 28) {
      throw new Error('Choose a day between 1 and 28 for monthly tasks.');
    }
    const cron = `${minute} ${hour} ${monthDay} * *`;
    return { expression: { type: 'cron', cron }, cronExpression: cron, runAt: null };
  }
  throw new Error('Choose a supported schedule frequency.');
}

export function formatAutomationSchedule(input: AutomationScheduleInput): string {
  if (input.frequency === 'once') {
    return `Once · ${(input.runAt || '').replace('T', ' ')}`;
  }
  if (input.frequency === 'weekly') {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Every ${weekdays[Number(input.weekday)] || 'week'} at ${input.time || '00:00'}`;
  }
  if (input.frequency === 'monthly') {
    return `Monthly on day ${input.monthDay || 1} at ${input.time || '00:00'}`;
  }
  return `Daily at ${input.time || '00:00'}`;
}
