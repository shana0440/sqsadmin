import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserEmail } from '#/utils/session.server'
import { canAccessQueue } from '#/lib/permission'
import { redriveMessage } from '#/lib/sqs'

export const Route = createFileRoute(
  '/api/queues/$queueUrl/messages/redrive',
)({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const email = await getAuthUserEmail()

          if (!email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const decodedQueueUrl = Buffer.from(
            params.queueUrl,
            'base64',
          ).toString('utf-8')

          if (!canAccessQueue(decodedQueueUrl, email)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }

          const { messageId, targetQueueUrl } = await request.json()

          if (!messageId || typeof messageId !== 'string') {
            return Response.json(
              { error: 'Message ID is required' },
              { status: 400 },
            )
          }

          if (!targetQueueUrl || typeof targetQueueUrl !== 'string') {
            return Response.json(
              { error: 'Target queue URL is required' },
              { status: 400 },
            )
          }

          if (!canAccessQueue(targetQueueUrl, email)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }

          await redriveMessage(decodedQueueUrl, targetQueueUrl, messageId)
          return Response.json({ success: true })
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to redrive message: ${error.message}`
              : 'Failed to redrive message'

          return Response.json({ error: errorMessage }, { status: 500 })
        }
      },
    },
  },
})
