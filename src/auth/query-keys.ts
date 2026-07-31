import type { ActorType } from './types'

export const authQueryKeys = {
  all: ['auth'] as const,
  me(actorType?: ActorType, id?: string) {
    return ['auth', 'me', actorType ?? 'anonymous', id ?? 'anonymous'] as const
  },
}
