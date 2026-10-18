/**
 * Package-owned invariant companion for `@zibokapi/dsh-codex-computer-use/computer-tools`.
 * @module @zibokapi/dsh-codex-computer-use/computer-tools/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'

const PACKAGE_NAME = '@zibokapi/dsh-codex-computer-use/computer-tools'

/** Cordis companion plugin name. */
export const name = 'tool-computer-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = { optional: ['invariants'] }

/**
 * No runtime invariant: this package exposes no independent event sequence or mutable data relation
 * beyond contracts enforced at its owning seam.
 */
const install = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve((ctx as Context & { invariants?: { register(name: string, installer: () => void): () => void } }).invariants?.register(PACKAGE_NAME, install) ?? (() => {}))
/* jscpd:ignore-end */
