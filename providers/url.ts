export type WebpageSnapshot = {
  url: string;
  finalUrl: string;
  title: string;
  text: string;
};

const decodeEntities = (value: string): string => value
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'");

const readLimitedText = async (response: Response, maximumBytes: number): Promise<string> => {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maximumBytes) {
    const {done, value} = await reader.read();
    if (done) break;
    const remaining = maximumBytes - total;
    chunks.push(value.slice(0, remaining));
    total += value.byteLength;
    if (value.byteLength > remaining) break;
  }
  await reader.cancel();
  return new TextDecoder().decode(Buffer.concat(chunks));
};

export const fetchWebpage = async (input: string): Promise<WebpageSnapshot> => {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only public HTTP(S) webpage URLs without embedded credentials are supported');
  }
  const response = await fetch(url, {
    headers: {'user-agent': 'MotionForge/0.1 (+local-video-authoring)'},
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`URL returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Expected an HTML webpage, received ${contentType || 'unknown content type'}`);
  }
  const html = await readLimitedText(response, 2_000_000);
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? url.hostname);
  const text = decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20_000));
  return {url: input, finalUrl: response.url, title, text};
};
