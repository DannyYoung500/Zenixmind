export const WORKSPACE_NAVIGATION = [
  { id: 'chat', label: 'Chat', to: '/assistant' },
  { id: 'images', label: 'Imagine', to: '/assistant?view=images' },
  { id: 'library', label: 'My stuff', to: '/assistant?view=library' },
  { id: 'automations', label: 'Automations', to: '/assistant?view=automations' },
  { id: 'projects', label: 'Projects', to: '/assistant?view=projects' }
] as const;
