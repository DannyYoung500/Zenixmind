import React from 'react';
import { AssistantPage } from './AssistantPage';

/**
 * Dashboard is the signed-in ZenixMind home.
 * Keep one real conversation surface instead of a separate marketing-style
 * dashboard that sends users somewhere else.
 */
export function DashboardPage() {
  return <AssistantPage />;
}
