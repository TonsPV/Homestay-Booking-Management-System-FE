import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('..', import.meta.url))
const viteCli = fileURLToPath(
  new URL('../node_modules/vite/bin/vite.js', import.meta.url),
)
const playwrightCli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
)
const applicationUrl = 'http://127.0.0.1:5173'

const server = spawn(
  process.execPath,
  [viteCli, '--host', '127.0.0.1'],
  {
    cwd: projectDirectory,
    stdio: ['ignore', 'inherit', 'inherit'],
  },
)

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForServer() {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before E2E started (${server.exitCode}).`)
    }

    try {
      const response = await fetch(applicationUrl, {
        signal: AbortSignal.timeout(1_000),
      })

      if (response.ok) {
        return
      }
    } catch {
      // Vite is still starting.
    }

    await delay(250)
  }

  throw new Error('Timed out waiting for the Vite E2E server.')
}

async function stopServer() {
  if (server.exitCode !== null) {
    return
  }

  server.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    delay(2_000),
  ])

  if (server.exitCode === null && process.platform === 'win32') {
    spawnSync(
      'taskkill',
      ['/pid', String(server.pid), '/T', '/F'],
      { stdio: 'ignore' },
    )
  }
}

try {
  await waitForServer()

  const tests = spawn(
    process.execPath,
    [playwrightCli, 'test', ...process.argv.slice(2)],
    {
      cwd: projectDirectory,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL:
          process.env.PLAYWRIGHT_BASE_URL ?? applicationUrl,
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
  console.error(error)
  process.exitCode = 1
} finally {
  await stopServer()
}
