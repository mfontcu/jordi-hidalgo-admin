/** One Server-Sent Event. `data` joins every data line with newlines. Comments are dropped. */
export type SseMessage = {
  id?: string;
  event?: string;
  data: string;
};

/**
 * Pulls complete SSE events out of a chunk buffer. A trailing partial event stays in `rest`.
 * Blank lines separate events. A line that starts with `:` is a comment, such as `: ping`.
 */
export function consumeSse(buffer: string): { messages: SseMessage[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const messages: SseMessage[] = [];
  let rest = normalized;
  let splitAt = rest.indexOf('\n\n');
  while (splitAt !== -1) {
    const message = messageOf(rest.slice(0, splitAt));
    if (message) messages.push(message);
    rest = rest.slice(splitAt + 2);
    splitAt = rest.indexOf('\n\n');
  }
  return { messages, rest };
}

function messageOf(block: string): SseMessage | null {
  let id: string | undefined;
  let event: string | undefined;
  const data: string[] = [];
  let sawField = false;
  for (const line of block.split('\n')) {
    if (line === '' || line.startsWith(':')) continue;
    sawField = true;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'id') id = value;
    else if (field === 'event') event = value;
    else if (field === 'data') data.push(value);
  }
  if (!sawField) return null;
  return { id, event, data: data.join('\n') };
}
