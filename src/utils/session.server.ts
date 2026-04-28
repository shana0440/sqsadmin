import { getRequest } from '@tanstack/react-start/server';
import { getSession } from 'start-authjs';
import { authConfig } from './auth';

/**
 * Get the authenticated user's email from the current request.
 * Server-only — must only be called from server routes / server functions.
 */
export async function getAuthUserEmail(): Promise<string | null> {
  const request = getRequest();
  const session = await getSession(request, authConfig);
  return session?.user?.email ?? null;
}
