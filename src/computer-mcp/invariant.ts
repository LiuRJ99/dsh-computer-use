/**
 * Package-owned invariant companion for `@zibokapi/dsh-codex-computer-use/computer-mcp`.
 * @module @zibokapi/dsh-codex-computer-use/computer-mcp/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'

const PACKAGE_NAME = '@zibokapi/dsh-codex-computer-use/computer-mcp'

/** Cordis companion plugin name. */
export const name = 'computer-mcp-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = { optional: ['invariants'] }

/**
 * No runtime invariant: the MCP server exposes no independent event sequence
 * or mutable data relation — every protocol answer is a projection of the
 * engine's seam methods, whose contracts the engine already enforces.
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
