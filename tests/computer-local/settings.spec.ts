/** The `computer` settings section layered over the engine's composition entry. */

import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { COMPUTER_SETTINGS_NAMESPACE } from '../../src/computer/index.ts'
import { LocalComputerEngine, assertServiceableComputerConfig } from '../../src/computer-local/index.ts'
import { useMacOSFakeDaemon } from '../fake-daemon-platform.ts'

useMacOSFakeDaemon()

const fixturePath = fileURLToPath(new URL('./fixtures/fake-daemon.mjs', import.meta.url))

/** Focused stand-in for the Host's Loader-derived settings form. */
class MemorySettings {
  constructor(public value: Record<string, unknown>) {}
  describe() {
    return [{ ns: COMPUTER_SETTINGS_NAMESPACE, value: structuredClone(this.value) }]
  }
  async update(_ns: string, patch: object) {
    const next = { ...this.value, ...patch }
    assertServiceableComputerConfig(next)
    this.value = next
  }
}

async function boot(config: ConstructorParameters<typeof LocalComputerEngine>[1] = {}): Promise<{
  ctx: Context
  settingsFiber: { dispose(): Promise<void> }
  engineFiber: { dispose(): Promise<void> }
  engine: LocalComputerEngine
}> {
  const ctx = new Context()
  await ctx.plugin(LocalSubprocessRuntime)
  const settings = new MemorySettings({ helperPath: process.execPath, helperArgs: [fixturePath], timeoutMs: 60_000,
    maxTimeoutMs: 120_000, maxTreeBytes: 256_000, maxScreenshotBytes: 2_097_152, graceMs: 3_000, ...config })
  const release = ctx.provide('settings', settings as never)
  const settingsFiber = { dispose: async () => { await release() } }
  const engineFiber = ctx.plugin(LocalComputerEngine, {
    helperPath: process.execPath,
    helperArgs: [fixturePath],
    timeoutMs: 60_000,
    ...config,
  })
  await engineFiber.await()
  return { ctx, settingsFiber, engineFiber, engine: ctx.computer as LocalComputerEngine }
}

describe('computer settings section', () => {
  it('resolves the user layer over the composition entry', async () => {
    const bench = await boot()
    expect(bench.engine.config.timeoutMs).toBe(60_000)

    await bench.ctx.settings.update(COMPUTER_SETTINGS_NAMESPACE, { timeoutMs: 5_000 })

    expect(bench.engine.config.timeoutMs).toBe(5_000)
    await bench.ctx.fiber.dispose()
  })

  it('refuses a stored value the constructor would have rejected', async () => {
    const bench = await boot()

    await expect(bench.ctx.settings.update(COMPUTER_SETTINGS_NAMESPACE, { timeoutMs: 0 }))
      .rejects.toThrow(/positive finite/)

    expect(bench.engine.config.timeoutMs).toBe(60_000)
    await bench.ctx.fiber.dispose()
  })

  it('refuses a grace period longer than a timer can carry', async () => {
    const bench = await boot()

    await expect(bench.ctx.settings.update(COMPUTER_SETTINGS_NAMESPACE, { graceMs: Number.MAX_SAFE_INTEGER }))
      .rejects.toThrow(/graceMs must be no greater than/)

    await bench.ctx.fiber.dispose()
  })

  it('serves the stored section to every later read', async () => {
    const bench = await boot()
    await bench.ctx.settings.update(COMPUTER_SETTINGS_NAMESPACE, { maxTreeBytes: 1_024 })

    expect(bench.engine.config.maxTreeBytes).toBe(1_024)
    await bench.ctx.fiber.dispose()
  })

  it('falls back to the composition entry when the settings provider detaches', async () => {
    const bench = await boot()
    await bench.ctx.settings.update(COMPUTER_SETTINGS_NAMESPACE, { timeoutMs: 5_000 })
    expect(bench.engine.config.timeoutMs).toBe(5_000)

    await bench.settingsFiber.dispose()

    expect(bench.engine.config.timeoutMs).toBe(60_000)
    await bench.ctx.fiber.dispose()
  })

  it('keeps the composition entry when no settings provider is mounted', async () => {
    const ctx = new Context()
    await ctx.plugin(LocalSubprocessRuntime)
    await ctx.plugin(LocalComputerEngine, {
      helperPath: process.execPath,
      helperArgs: [fixturePath],
      timeoutMs: 1_234,
    })

    expect((ctx.computer as LocalComputerEngine).config.timeoutMs).toBe(1_234)
    await ctx.fiber.dispose()
  })

})
