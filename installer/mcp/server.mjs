#!/usr/bin/env node

import { createInterface } from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInstallerSession, publicInstallerSession } from '../yhtctl/lib/installer-session.mjs'
import { installerActions, runInstallerAction } from '../yhtctl/lib/installer-session-runner.mjs'
import { startInstallerServer } from '../yhtctl/lib/installer-server.mjs'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const stateRoot = process.env.YHT_INSTALLER_STATE_ROOT
let localServer = null

const tools = [
  {
    name: 'create_install_session',
    description: 'Create a Yihetong installation session from non-secret configuration. Never include passwords, tokens, keys, or credentials.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['quick', 'custom'] },
        config: { type: 'object', description: 'Non-secret installation configuration only.' },
      },
      required: ['mode'],
    },
  },
  {
    name: 'get_install_session',
    description: 'Read redacted state, real progress events, entries, and fingerprint for an existing installation session.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
  },
  {
    name: 'run_install_action',
    description: 'Run a bounded action through the shared yhtctl installation session. Destructive uninstall and rollback still require human confirmation in the local UI.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { sessionId: { type: 'string' }, action: { type: 'string', enum: installerActions.filter((item) => !['rollback', 'uninstall'].includes(item)) }, dryRun: { type: 'boolean' } },
      required: ['sessionId', 'action'],
    },
  },
  {
    name: 'open_secret_input',
    description: 'Start or reuse the protected loopback installer UI and return its local URL. Enter secrets there, never in the assistant prompt.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
]

function content(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

async function callTool(name, args) {
  if (name === 'create_install_session') return content(createInstallerSession({ root: stateRoot, packageRoot, mode: args.mode, config: args.config || {}, createdBy: 'mcp' }))
  if (name === 'get_install_session') return content(publicInstallerSession({ root: stateRoot, id: args.sessionId }))
  if (name === 'run_install_action') return content(await runInstallerAction({ root: stateRoot, id: args.sessionId, action: args.action, dryRun: args.dryRun === true }))
  if (name === 'open_secret_input') {
    if (!localServer) localServer = await startInstallerServer({ stateRoot, packageRoot })
    return content({ status: 'pass', localOnly: true, url: localServer.url, instruction: '在本机页面输入秘密；不要把秘密发给智能助手。' })
  }
  throw new Error(`Unknown tool: ${name}`)
}

async function handle(message) {
  if (message.method === 'initialize') return { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'yihetong-installer', version: '1.0.0' } }
  if (message.method === 'notifications/initialized') return null
  if (message.method === 'tools/list') return { tools }
  if (message.method === 'tools/call') return callTool(message.params?.name, message.params?.arguments || {})
  throw new Error(`Unsupported method: ${message.method}`)
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
input.on('line', async (line) => {
  let request
  try {
    request = JSON.parse(line)
    const result = await handle(request)
    if (request.id !== undefined && result !== null) process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result })}\n`)
  } catch (error) {
    if (request?.id !== undefined) process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32000, message: error.message } })}\n`)
  }
})
