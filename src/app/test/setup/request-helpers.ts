export function jsonRequest(url: string, method: string, body?: unknown, headers?: Record<string,string>) {
  // Ensure absolute URL for Request constructor
  const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  
  return new Request(absoluteUrl, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function readJson<T = any>(res: Response): Promise<{ status: number; json: T }> {
  const data = await res.json()
  return { status: res.status, json: data as T }
}
