import { QueueClient } from '@vercel/queue';
import type { ScheduleQueueMessage } from '@vercel/schedules';
import { processAutomationQueueMessage } from './_lib/automation-worker.ts';

const queue = new QueueClient();
export const config = { maxDuration: 60 };

type AutomationPayload = { automationId: string; userId: string; manual?: boolean };

export default queue.handleNodeCallback(async (message: ScheduleQueueMessage<AutomationPayload>, metadata) => {
  await processAutomationQueueMessage(message, metadata);
});
