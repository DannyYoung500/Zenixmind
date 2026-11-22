export type ChatCommand = {
  id: string;
  trigger: string;
  aliases: string[];
  label: string;
  description: string;
  category: 'Create' | 'Research' | 'Write' | 'Code' | 'Workspace';
  action: 'image' | 'search' | 'prompt' | 'help';
  instruction?: string;
};

export const CHAT_COMMANDS: ChatCommand[] = [
  { id: 'image', trigger: '/image', aliases: ['/imagine', '/draw', '/create-image'], label: 'Generate an image', description: 'Create an image and save it to your Library', category: 'Create', action: 'image' },
  { id: 'search', trigger: '/search', aliases: [], label: 'Search the web', description: 'Research a topic using web search', category: 'Research', action: 'search' },
  { id: 'summarize', trigger: '/summarize', aliases: [], label: 'Summarize', description: 'Summarize text, documents, or a topic', category: 'Write', action: 'prompt', instruction: 'Summarize the supplied material clearly. Preserve key facts, decisions, and important caveats. If no material was supplied, ask what should be summarized.' },
  { id: 'write', trigger: '/write', aliases: [], label: 'Write content', description: 'Draft articles, emails, proposals, and more', category: 'Write', action: 'prompt', instruction: 'Help the user create the requested written content. Ask a concise clarification only if essential.' },
  { id: 'translate', trigger: '/translate', aliases: [], label: 'Translate', description: 'Translate text and preserve its meaning and tone', category: 'Write', action: 'prompt', instruction: 'Translate the supplied text accurately. Preserve formatting and tone. If the target language is missing, ask for it.' },
  { id: 'explain', trigger: '/explain', aliases: [], label: 'Explain a topic', description: 'Get a clear step-by-step explanation', category: 'Research', action: 'prompt', instruction: 'Explain the requested topic clearly, step by step, defining technical terms and using a practical example where useful.' },
  { id: 'code', trigger: '/code', aliases: [], label: 'Code assistant', description: 'Write, review, or debug code', category: 'Code', action: 'prompt', instruction: 'Act as a careful software engineering assistant. Provide correct, maintainable code, explain assumptions, and include relevant tests when appropriate.' },
  { id: 'analyze', trigger: '/analyze', aliases: [], label: 'Analyze content', description: 'Analyze an attached file or supplied information', category: 'Research', action: 'prompt', instruction: 'Analyze the supplied content carefully. Separate evidence from assumptions, identify key findings, and state limitations. If an attachment is expected but missing, ask the user to upload it.' },
  { id: 'build', trigger: '/build', aliases: [], label: 'Build a project', description: 'Plan an app, website, or software feature', category: 'Code', action: 'prompt', instruction: 'Help design and build the requested software project. Start with a concrete architecture and implementation plan, then provide production-minded code and tests. Do not claim to deploy or modify external systems unless an actual connected tool performs that action.' },
  { id: 'help', trigger: '/help', aliases: [], label: 'Show commands', description: 'See available ZenixMind chat commands', category: 'Workspace', action: 'help' }
];

export function getChatCommand(name: string): ChatCommand | undefined {
  const normalized = name.trim().replace(/^\//, '').toLowerCase();
  return CHAT_COMMANDS.find((command) =>
    command.trigger.slice(1) === normalized || command.aliases.some((alias) => alias.slice(1) === normalized)
  );
}

export function parseChatCommand(input: string): { command: string; prompt: string } | null {
  const match = input.trim().match(/^\/([a-z][a-z0-9-]*)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const definition = getChatCommand(match[1]);
  if (!definition) return null;
  return { command: definition.id, prompt: (match[2] || '').trim() };
}

export function getCommandSuggestions(input: string): ChatCommand[] {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith('/') || /\s/.test(trimmed)) return [];
  const query = trimmed.slice(1).toLowerCase();
  return CHAT_COMMANDS.filter((command) =>
    command.trigger.slice(1).startsWith(query) ||
    command.aliases.some((alias) => alias.slice(1).startsWith(query))
  );
}

export function isUnknownSlashCommand(input: string): boolean {
  const trimmed = input.trim();
  return /^\/[a-z][a-z0-9-]*(?:\s|$)/i.test(trimmed) && parseChatCommand(trimmed) === null;
}
