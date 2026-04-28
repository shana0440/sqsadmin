import { createFileRoute } from '@tanstack/react-router';
import {
  sendMessage,
  peekMessages,
  receiveMessages,
  deleteMessage,
  receiveMessageById,
} from '#/lib/sqs';
import { getAuthUserEmail } from '#/utils/session.server';
import { canAccessQueue } from '#/lib/permission';

export const Route = createFileRoute('/api/queues/$queueUrl/messages')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
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

          const { searchParams } = new URL(request.url);
          const maxMessages = parseInt(searchParams.get('max') || '10', 10);
          const mode = searchParams.get('mode') || 'peek';

          const messages =
            mode === 'receive'
              ? await receiveMessages(decodedQueueUrl, maxMessages)
              : await peekMessages(decodedQueueUrl, maxMessages);

          return Response.json(messages);
        } catch (error) {
          console.error('Error in GET /api/queues/[queueUrl]/messages:', error);
          return Response.json(
            { error: 'Failed to fetch messages' },
            { status: 500 },
          );
        }
      },

      POST: async ({ request, params }) => {
        try {
          const decodedQueueUrl = Buffer.from(
            params.queueUrl,
            'base64',
          ).toString('utf-8');
          const { message } = await request.json();

          if (!message) {
            return Response.json(
              { error: 'Message body is required' },
              { status: 400 },
            );
          }

          const messageBody =
            typeof message === 'object' ? JSON.stringify(message) : message;

          const success = await sendMessage(decodedQueueUrl, messageBody);

          if (success) {
            return Response.json({ success: true });
          } else {
            return Response.json(
              { error: 'Failed to send message' },
              { status: 500 },
            );
          }
        } catch (error) {
          console.error(
            'Error in POST /api/queues/[queueUrl]/messages:',
            error,
          );
          return Response.json(
            { error: 'Failed to send message' },
            { status: 500 },
          );
        }
      },

      DELETE: async ({ request, params }) => {
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

          const { receiptHandle, messageId, peekMode } = await request.json();

          if (peekMode && messageId) {
            console.log(
              'Peek mode delete requested for message ID:',
              messageId,
            );

            const message = await receiveMessageById(
              decodedQueueUrl,
              messageId,
            );

            if (!message) {
              return Response.json(
                { error: 'Message not found or no longer available' },
                { status: 404 },
              );
            }

            const success = await deleteMessage(
              decodedQueueUrl,
              message.receiptHandle,
            );

            if (success) {
              return Response.json({ success: true });
            } else {
              return Response.json(
                { error: 'Failed to delete message' },
                { status: 500 },
              );
            }
          } else if (receiptHandle) {
            const success = await deleteMessage(decodedQueueUrl, receiptHandle);

            if (success) {
              return Response.json({ success: true });
            } else {
              return Response.json(
                { error: 'Failed to delete message' },
                { status: 500 },
              );
            }
          } else {
            return Response.json(
              { error: 'Receipt handle or message ID is required' },
              { status: 400 },
            );
          }
        } catch (error) {
          console.error(
            'Error in DELETE /api/queues/[queueUrl]/messages:',
            error,
          );
          return Response.json(
            { error: 'Failed to delete message' },
            { status: 500 },
          );
        }
      },
    },
  },
});
