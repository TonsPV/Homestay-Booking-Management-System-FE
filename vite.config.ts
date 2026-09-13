import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export function resolveProxyTarget(value: string | undefined) {
  const target = value?.trim() || 'http://localhost:3000'

  let url: URL

  try {
    url = new URL(target)
  } catch {
    throw new Error(
      'VITE_DEV_API_PROXY_TARGET must be an absolute HTTP(S) origin.',
    )
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'VITE_DEV_API_PROXY_TARGET must be an HTTP(S) origin without a path, query, or fragment.',
    )
  }

  return url.origin
}

export function createDevProxy(proxyTarget: string | undefined) {
  const target = resolveProxyTarget(proxyTarget)

  return {
    '/api/v1': {
      changeOrigin: true,
      target,
    },
    '/media': {
      changeOrigin: true,
      target,
    },
    '/socket.io': {
      changeOrigin: true,
      target,
      ws: true,
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = createDevProxy(
    env.VITE_DEV_API_PROXY_TARGET || env.VITE_API_ORIGIN,
  )

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
