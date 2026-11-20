export function splitSseFrames(buffer: string): { frames: string[]; remainder: string } {
  const frames = buffer.split(/\r?\n\r?\n/);
  const remainder = frames.pop() ?? '';
  return { frames: frames.filter((frame) => frame.trim().length > 0), remainder };
}

export function parseSseEvent(frame: string): unknown | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (!data) return null;
  return JSON.parse(data);
}
