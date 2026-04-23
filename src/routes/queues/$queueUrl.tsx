import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import QueueDetail from '#/components/QueueDetail'
import { QueueInfo } from '#/lib/sqs'

export const Route = createFileRoute('/queues/$queueUrl')({
  component: QueueDetailPage,
})

function QueueDetailPage() {
  const { queueUrl } = Route.useParams()
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQueueInfo = async () => {
      try {
        setLoading(true)
        if (!queueUrl) {
          throw new Error('Queue URL parameter is missing')
        }

        const response = await fetch(`/api/queues/${queueUrl}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch queue: ${response.statusText}`)
        }

        const queue = await response.json()

        if (queue) {
          setQueueInfo(queue)
        } else {
          throw new Error('Queue not found')
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch queue information',
        )
        console.error('Error fetching queue info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQueueInfo()
  }, [queueUrl])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="text-center py-12 dark:text-gray-300">
          Loading queue information...
        </div>
      </div>
    )
  }

  if (error || !queueInfo) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                {error || 'Failed to load queue information'}
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
        >
          ← Back to queue list
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
        >
          ← Back to queue list
        </Link>
      </div>

      <header className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {queueInfo.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-all">
            {queueInfo.url}
          </p>
        </div>
        <div className="flex space-x-2 justify-start md:justify-end">
          <button
            onClick={() =>
              document.getElementById('produce-message-button')?.click()
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Produce Message
          </button>
        </div>
      </header>

      <main>
        <QueueDetail
          queueUrl={queueUrl}
          queueName={queueInfo.name}
          queueAttributes={queueInfo.attributes}
          deadLetterSourceQueues={queueInfo.deadLetterSourceQueues}
        />
      </main>
    </div>
  )
}
