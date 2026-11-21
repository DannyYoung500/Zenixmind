const IMAGE_MODELS = new Set(['zimage', 'flux']);

export function normalizeImagePrompt(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Enter a prompt before generating an image.');
  }
  const prompt = value.trim();
  if (prompt.length > 4000) {
    throw new Error('Your image prompt is too long. Keep it under 4,000 characters.');
  }
  return prompt;
}

export function buildPollinationsImageUrl(
  prompt: string,
  model: string,
  width: number,
  height: number
): string {
  if (!IMAGE_MODELS.has(model)) throw new Error('Unsupported image model.');
  if (![512, 768, 1024].includes(width) || ![512, 768, 1024].includes(height)) {
    throw new Error('Image dimensions must be 512, 768, or 1024 pixels.');
  }
  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&width=${width}&height=${height}&seed=-1&safe=true`;
}
