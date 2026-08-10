import { describe, expect, it } from 'vitest'

import { createDevProxy, resolveProxyTarget } from './vite.config'

describe('Vite development proxy', () => {
  it('routes API and media paths to the validated backend origin', () => {
    const proxy = createDevProxy('https://api.example.test/')

    expect(proxy).toEqual({
      '/api/v1': {
        changeOrigin: true,
        target: 'https://api.example.test',
      },
      '/media': {
        changeOrigin: true,
        target: 'https://api.example.test',
      },
    })
  })

  it('uses localhost when no development target is configured', () => {
    expect(resolveProxyTarget(undefined)).toBe('http://localhost:3000')
  })

  it.each([
    'https://api.example.test/api',
    'https://api.example.test?tenant=demo',
    'ftp://api.example.test',
    'not-an-origin',
  ])('rejects a non-origin proxy target: %s', (target) => {
    expect(() => resolveProxyTarget(target)).toThrow()
  })
})
