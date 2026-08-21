const COPY_FEEDBACK_EMOJI = '✌️';
const COPY_FEEDBACK_FALLBACK = '已复制';

function canRenderEmoji(emoji: string): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.textBaseline = 'top';
  ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillText(emoji, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) return true;
  }

  return false;
}

export const DEV_INSPECT_COPY_FEEDBACK = canRenderEmoji(COPY_FEEDBACK_EMOJI)
  ? COPY_FEEDBACK_EMOJI
  : COPY_FEEDBACK_FALLBACK;
