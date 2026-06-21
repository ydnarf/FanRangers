// URL shortener helper. Supports TinyURL via Bearer token.
// If SHORTENER_API_KEY is empty, returns the URL unchanged.

export async function shortenUrl(url: string): Promise<string> {
  const apiKey = process.env['SHORTENER_API_KEY'];
  if (!apiKey) return url;

  const service = process.env['SHORTENER_SERVICE'] ?? 'tinyurl';

  try {
    if (service === 'tinyurl') {
      const response = await fetch('https://api.tinyurl.com/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url, domain: 'tinyurl.com' }),
      });
      if (!response.ok) return url;
      const data = await response.json() as { data?: { tiny_url?: string } };
      return data?.data?.tiny_url ?? url;
    }
  } catch {
    // Fallback to original URL if shortener fails
  }

  return url;
}
