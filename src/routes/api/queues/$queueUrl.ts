import { createFileRoute } from '@tanstack/react-router';
import { getQueueAttributes, listDeadLetterSourceQueues } from '#/lib/sqs';
import { getAuthUserEmail } from '#/utils/session.server';
import { canAccessQueue } from '#/lib/permission';

export const Route = createFileRoute('/api/queues/$queueUrl')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const email = await getAuthUserEmail();

          if (!email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const decodedQueueUrl = Buffer.from(
            params.queueUrl,
            'base64',
          ).toString('utf-8');

          if (!canAccessQueue(decodedQueueUrl, email)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
          }

          const attributes = await getQueueAttributes(decodedQueueUrl);
          const deadLetterSourceQueues =
            await listDeadLetterSourceQueues(decodedQueueUrl);

          const name = decodedQueueUrl.split('/').pop() || decodedQueueUrl;

          return Response.json({
            url: decodedQueueUrl,
            name,
            attributes,
            deadLetterSourceQueues,
          });
        } catch (error) {
          console.error('Error in GET /api/queues/[queueUrl]:', error);
          return Response.json(
            { error: 'Failed to fetch queue details' },
            { status: 500 },
          );
        }
      },
    },
  },
});
