import { createFileRoute } from '@tanstack/react-router';
import { getEnvironmentNames } from '#/lib/config';
import { getAuthUserEmail } from '#/utils/session.server';

export const Route = createFileRoute('/api/environments')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const email = await getAuthUserEmail();

          if (!email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          return Response.json({ items: getEnvironmentNames() });
        } catch (error) {
          console.error('Error in /api/environments:', error);
          return Response.json(
            { error: 'Failed to fetch environments' },
            { status: 500 },
          );
        }
      },
    },
  },
});
