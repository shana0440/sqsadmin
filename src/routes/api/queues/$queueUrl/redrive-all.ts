import { createFileRoute } from '@tanstack/react-router';
import { getAuthUserEmail } from '#/utils/session.server';
import { canAccessQueue } from '#/lib/permission';
import {
  cancelMessageMoveTask,
  listMessageMoveTasks,
  redriveAllMessages,
} from '#/lib/sqs';

const RUNNING_STATUSES = new Set(['RUNNING', 'CANCELLING']);

export const Route = createFileRoute('/api/queues/$queueUrl/redrive-all')({
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

          const tasks = await listMessageMoveTasks(decodedQueueUrl, 10);
          const runningTask = tasks.find((task) =>
            RUNNING_STATUSES.has(task.Status || ''),
          );

          return Response.json({
            hasRunningTask: !!runningTask,
            runningTask,
            latestTask: tasks[0] || null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to list redrive tasks: ${error.message}`
              : 'Failed to list redrive tasks';

          return Response.json({ error: errorMessage }, { status: 500 });
        }
      },
      POST: async ({ request, params }) => {
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

          const { targetQueueUrl, maxNumberOfMessagesPerSecond } =
            await request.json();

          if (!targetQueueUrl || typeof targetQueueUrl !== 'string') {
            return Response.json(
              { error: 'Target queue URL is required' },
              { status: 400 },
            );
          }

          if (!canAccessQueue(targetQueueUrl, email)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
          }

          if (
            maxNumberOfMessagesPerSecond !== undefined &&
            (!Number.isInteger(maxNumberOfMessagesPerSecond) ||
              maxNumberOfMessagesPerSecond <= 0 ||
              maxNumberOfMessagesPerSecond > 500)
          ) {
            return Response.json(
              {
                error:
                  'maxNumberOfMessagesPerSecond must be a positive integer less than or equal to 500',
              },
              { status: 400 },
            );
          }

          const taskHandle = await redriveAllMessages(
            decodedQueueUrl,
            targetQueueUrl,
            maxNumberOfMessagesPerSecond,
          );

          return Response.json({
            success: true,
            taskHandle,
            hasRunningTask: !!taskHandle,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to redrive all messages: ${error.message}`
              : 'Failed to redrive all messages';

          return Response.json({ error: errorMessage }, { status: 500 });
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

          const body = await request.json().catch(() => ({}));
          const requestedTaskHandle =
            typeof body?.taskHandle === 'string' ? body.taskHandle : undefined;

          let taskHandleToCancel = requestedTaskHandle;

          if (!taskHandleToCancel) {
            const tasks = await listMessageMoveTasks(decodedQueueUrl, 10);
            const runningTask = tasks.find((task) => task.Status === 'RUNNING');
            taskHandleToCancel = runningTask?.TaskHandle;
          }

          if (!taskHandleToCancel) {
            return Response.json(
              { error: 'No running redrive task found to cancel' },
              { status: 409 },
            );
          }

          const approximateNumberOfMessagesMoved =
            await cancelMessageMoveTask(taskHandleToCancel);

          return Response.json({
            success: true,
            approximateNumberOfMessagesMoved,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to cancel redrive task: ${error.message}`
              : 'Failed to cancel redrive task';

          return Response.json({ error: errorMessage }, { status: 500 });
        }
      },
    },
  },
});
