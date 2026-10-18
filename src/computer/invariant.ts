/**
 * Package-owned invariant companion for the computer-use seam.
 * @module @zibokapi/dsh-codex-computer-use/computer/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'

const PACKAGE_NAME = '@zibokapi/dsh-codex-computer-use/computer'

/** Cordis companion plugin name. */
export const name = 'computer-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = { optional: ['invariants'] }

/** No runtime invariant: this stateless Service Definition owns request/result types, while engines and consumers own observations. */
const install = () => {}

/**
 * Register the computer-use invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve((ctx as Context & { invariants?: { register(name: string, installer: () => void): () => void } }).invariants?.register(PACKAGE_NAME, install) ?? (() => {}))
/* jscpd:ignore-end */
