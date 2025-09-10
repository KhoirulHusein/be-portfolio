// Helper untuk test params di Next.js 15
export function createTestParams<T>(params: T): Promise<T> {
  return Promise.resolve(params)
}
