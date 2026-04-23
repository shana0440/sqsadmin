import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getSession } from 'start-authjs'
import { authConfig } from './auth'
import type { AuthSession } from 'start-authjs'

export type { AuthSession }

export const fetchSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await getSession(request, authConfig)
    return session
  },
)
