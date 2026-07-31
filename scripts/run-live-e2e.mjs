import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('..', import.meta.url))
const viteCli = fileURLToPath(
  new URL('../node_modules/vite/bin/vite.js', import.meta.url),
)
const playwrightCli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
)

function requireSafeLiveEnvironment() {
  const apiOrigin = process.env.HBMS_LIVE_API_ORIGIN?.trim()
  const backendEnvironment = process.env.HBMS_LIVE_BACKEND_NODE_ENV?.trim()
  const database = process.env.HBMS_LIVE_BACKEND_DB?.trim()

  if (!apiOrigin) {
    throw new Error('HBMS_LIVE_API_ORIGIN is required.')
  }

  const parsedOrigin = new URL(apiOrigin)

  if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
    throw new Error('HBMS_LIVE_API_ORIGIN must use HTTP or HTTPS.')
  }

  if (backendEnvironment !== 'test') {
    throw new Error(
      'Refusing live E2E: HBMS_LIVE_BACKEND_NODE_ENV must equal test.',
    )
  }

  if (!database?.endsWith('_test')) {
    throw new Error(
      'Refusing live E2E: HBMS_LIVE_BACKEND_DB must end with _test.',
    )
  }

  return parsedOrigin.toString().replace(/\/+$/, '')
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForUrl(url, label) {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(1_000),
      })

      if (response.ok) {
        return
      }
    } catch {
      // The target is still starting.
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for ${label}: ${url}`)
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) {
    return
  }

  server.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    delay(2_000),
  ])

  if (server.exitCode === null && process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
    })
  }
}

let server

try {
  const apiOrigin = requireSafeLiveEnvironment()

  await waitForUrl(
    `${apiOrigin}/api/v1/rooms?limit=1&page=1`,
    'Backend test API',
  )

  server = spawn(
    process.execPath,
    [
      viteCli,
      '--host',
      '127.0.0.1',
      '--port',
      '5174',
      '--strictPort',
    ],
    {
      cwd: projectDirectory,
      env: {
        ...process.env,
        VITE_API_ORIGIN: apiOrigin,
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  )

  await delay(1_000)

  if (server.exitCode !== null) {
    throw new Error(
      `Vite exited before live E2E started (${server.exitCode}).`,
    )
  }

  const tests = spawn(
    process.execPath,
    [
      playwrightCli,
      'test',
      '--config',
      'playwright.live.config.ts',
      ...process.argv.slice(2),
    ],
    {
      cwd: projectDirectory,
      env: {
        ...process.env,
        HBMS_LIVE_API_ORIGIN: apiOrigin,
      },
      stdio: 'inherit',
    },
  )
  const testExitCode = await new Promise((resolve, reject) => {
    tests.once('error', reject)
    tests.once('close', (code) => resolve(code ?? 1))
  })

  process.exitCode = testExitCode
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await stopServer(server)
}
