const COMMAND_INSTRUCTIONS: Record<string, string> = {
  summarize: 'For this request, summarize the supplied material clearly. Preserve key facts, decisions, and important caveats. If no material was supplied, ask what should be summarized.',
  write: 'For this request, help create the requested written content. Ask a concise clarification only if essential.',
  translate: 'For this request, translate the supplied text accurately. Preserve formatting and tone. If the target language is missing, ask for it.',
  explain: 'For this request, explain the topic clearly, step by step, define technical terms, and use a practical example where useful.',
  code: 'For this request, act as a careful software engineering assistant. Provide correct, maintainable code, explain assumptions, and include relevant tests when appropriate.',
  analyze: 'For this request, analyze the supplied content carefully. Separate evidence from assumptions, identify key findings, and state limitations. If an attachment is expected but missing, ask the user to upload it.',
  build: 'For this request, help design and build the requested software project. Start with a concrete architecture and implementation plan, then provide production-minded code and tests. Do not claim to deploy or modify external systems unless an actual connected tool performs that action.'
};

export function getChatCommandInstruction(command: unknown): string | null {
  if (typeof command !== 'string') return null;
  return COMMAND_INSTRUCTIONS[command] || null;
}
