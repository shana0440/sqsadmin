import { createFileRoute } from '@tanstack/react-router';
import { getAllowedSystemsByEmail } from '#/lib/config';
import { getAuthUserEmail } from '#/utils/session.server';

export const Route = createFileRoute('/api/systems')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const email = await getAuthUserEmail();

          if (!email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          return Response.json({ items: getAllowedSystemsByEmail(email) });
        } catch (error) {
          console.error('Error in /api/systems:', error);
          return Response.json(
            { error: 'Failed to fetch systems' },
            { status: 500 },
          );
        }
      },
    },
  },
});
