import { afterAll, beforeAll } from 'vitest'

/** Simulate the supported host for suites that drive only the Node fake daemon. */
export function useMacOSFakeDaemon(): void {
  const original = Object.getOwnPropertyDescriptor(process, 'platform')!
  beforeAll(() => Object.defineProperty(process, 'platform', { ...original, value: 'darwin' }))
  afterAll(() => Object.defineProperty(process, 'platform', original))
}
