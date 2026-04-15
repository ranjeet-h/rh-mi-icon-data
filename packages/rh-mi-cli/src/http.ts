export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new HttpError(`Request failed (${response.status}) for ${url}`, response.status, url);
  }
  return response.text();
};

export const fetchJson = async <T>(url: string): Promise<T> => {
  const text = await fetchText(url);
  return JSON.parse(text) as T;
};

