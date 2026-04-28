import { createFileRoute } from '@tanstack/react-router'
import { listQueues, getQueueAttributes } from '#/lib/sqs'
import { getAuthUserEmail } from '#/utils/session.server'
import {
  getAllowedQueueNamePatternsByEmail,
  getAllowedSystemsByEmail,
  getQueueNamePatternsBySystem,
} from '#/lib/config'

export const Route = createFileRoute('/api/queues')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const email = await getAuthUserEmail()

          if (!email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const allowedSystems = getAllowedSystemsByEmail(email)
          const { searchParams } = new URL(request.url)
          const system = searchParams.get('system') || ''
          const queueNamePatterns =
            system && allowedSystems.includes(system)
              ? getQueueNamePatternsBySystem(system)
              : getAllowedQueueNamePatternsByEmail(email)

          if (queueNamePatterns.length === 0) {
            return Response.json({ items: [], nextToken: undefined })
          }

          const nextToken = searchParams.get('nextToken') || undefined
          const limit = parseInt(searchParams.get('limit') || '100', 10)

          const { items: queues, nextToken: newNextToken } = await listQueues(
            nextToken,
            limit,
            queueNamePatterns,
          )

          const queuesWithAttributes = await Promise.all(
            queues.map(async (queue) => {
              const attributes = await getQueueAttributes(queue.url)
              return { ...queue, attributes }
            }),
          )

          return Response.json({
            items: queuesWithAttributes,
            nextToken: newNextToken,
            systems: allowedSystems,
          })
        } catch (error) {
          console.error('Error in /api/queues:', error)
          return Response.json(
            { error: 'Failed to fetch queues' },
            { status: 500 },
          )
        }
      },
    },
  },
})
