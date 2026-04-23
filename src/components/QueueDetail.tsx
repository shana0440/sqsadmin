import { useState, Fragment, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Message } from '~/lib/sqs'
import 'react-json-view-lite/dist/index.css'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/theme-dracula'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import RedriveMessageModal from './RedriveMessageModal'

interface QueueDetailProps {
  queueUrl: string
  queueName: string
  queueAttributes?: Record<string, string>
  deadLetterSourceQueues?: string[]
}

export default function QueueDetail({
  queueUrl,
  queueName,
  queueAttributes,
  deadLetterSourceQueues = [],
}: QueueDetailProps) {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('{}')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [isValidJson, setIsValidJson] = useState(true)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const messagesQueryKey = ['messages', queueUrl]

  const fetchMessages = async (): Promise<Message[]> => {
    const response = await fetch(
      `/api/queues/${queueUrl}/messages?mode=peek&max=50`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }
    return response.json()
  }

  const {
    data: messages = [],
    error: fetchError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: messagesQueryKey,
    queryFn: fetchMessages,
    refetchInterval: autoRefreshEnabled ? 5000 : false,
  })

  const loading = isLoading || isFetching
  const error = useMemo(() => {
    if (actionError) return actionError
    if (fetchError)
      return fetchError instanceof Error
        ? fetchError.message
        : 'Failed to fetch messages'
    return null
  }, [actionError, fetchError])

  const mutate = (
    updater?: (previous: Message[] | undefined) => Message[],
  ) => {
    if (updater) {
      queryClient.setQueryData(messagesQueryKey, updater)
    } else {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey })
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled((previous) => !previous)
  }

  const handleSendMessage = async () => {
    try {
      setSendingMessage(true)
      setSendError(null)

      let messageBody
      try {
        messageBody = JSON.parse(messageInput)
      } catch (e) {
        setSendError(
          'Invalid JSON format: ' +
            (e instanceof Error ? e.message : 'Unknown error'),
        )
        setSendingMessage(false)
        return
      }

      const response = await fetch(`/api/queues/${queueUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageBody }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      setMessageInput('{}')
      mutate()
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : 'Failed to send message',
      )
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const validateJson = (input: string) => {
    try {
      JSON.parse(input)
      setIsValidJson(true)
      setSendError(null)
      return true
    } catch (e) {
      setIsValidJson(false)
      setSendError(
        'Invalid JSON format: ' +
          (e instanceof Error ? e.message : 'Unknown error'),
      )
      return false
    }
  }

  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<string>>(
    new Set(),
  )
  const [redrivingMessageIds, setRedrivingMessageIds] = useState<Set<string>>(
    new Set(),
  )
  const [selectedMessageForRedrive, setSelectedMessageForRedrive] =
    useState<Message | null>(null)
  const [redriveError, setRedriveError] = useState<string | null>(null)

  const handleOpenRedriveModal = (message: Message) => {
    setSelectedMessageForRedrive(message)
    setRedriveError(null)
  }

  const handleCloseRedriveMessageModal = () => {
    setSelectedMessageForRedrive(null)
    setRedriveError(null)
  }

  const handleRedriveMessage = async (targetQueueUrl: string) => {
    if (!selectedMessageForRedrive) return

    const messageId = selectedMessageForRedrive.id

    try {
      setRedrivingMessageIds((prev) => new Set([...prev, messageId]))
      setRedriveError(null)

      const response = await fetch(`/api/queues/${queueUrl}/messages/redrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, targetQueueUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      mutate((previous) =>
        previous ? previous.filter((msg) => msg.id !== messageId) : [],
      )
      setSelectedMessageForRedrive(null)
    } catch (err) {
      setRedriveError(
        err instanceof Error ? err.message : 'Failed to redrive message',
      )
      console.error('Error redriving message:', err)
    } finally {
      setRedrivingMessageIds((prev) => {
        const updated = new Set(prev)
        updated.delete(messageId)
        return updated
      })
    }
  }

  const handleDeleteMessage = async (message: Message) => {
    try {
      const messageId = message.id
      setDeletingMessageIds((prev) => new Set([...prev, messageId]))

      const response = await fetch(`/api/queues/${queueUrl}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, peekMode: true }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete message')
      }

      mutate((previous) =>
        previous ? previous.filter((msg) => msg.id !== messageId) : [],
      )
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete message',
      )
      console.error('Error deleting message:', err)
    } finally {
      setDeletingMessageIds((prev) => {
        const updated = new Set(prev)
        updated.delete(message.id)
        return updated
      })
    }
  }

  const formatMessageBody = (body: string) => {
    try {
      const parsedBody = JSON.parse(body)
      const formattedJson = JSON.stringify(parsedBody, null, 2)

      return (
        <div className="rounded overflow-hidden">
          <AceEditor
            mode="json"
            theme="dracula"
            value={formattedJson}
            readOnly={true}
            name="message-viewer"
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              showLineNumbers: true,
              showGutter: true,
              highlightActiveLine: false,
              showPrintMargin: false,
              tabSize: 2,
              useWorker: false,
            }}
            width="100%"
            height="auto"
            minLines={5}
            maxLines={30}
            fontSize={12}
            wrapEnabled={true}
            style={{ borderRadius: '4px' }}
          />
        </div>
      )
    } catch {
      return (
        <pre className="whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded">
          {body}
        </pre>
      )
    }
  }

  const getMessageStatus = (message: Message) => {
    const attributes = message.attributes || {}
    let status = 'Available'
    let statusClass =
      'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'

    if (
      attributes.ApproximateFirstReceiveTimestamp &&
      attributes.SentTimestamp
    ) {
      const sentTime = parseInt(attributes.SentTimestamp, 10)
      const receiveTime = parseInt(
        attributes.ApproximateFirstReceiveTimestamp,
        10,
      )

      if (receiveTime - sentTime > 1000) {
        status = 'Delayed'
        statusClass =
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
      }
    }

    if (
      attributes.ApproximateReceiveCount &&
      parseInt(attributes.ApproximateReceiveCount, 10) > 0
    ) {
      status = 'In Flight'
      statusClass =
        'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
    }

    if (deletingMessageIds.has(message.id)) {
      status = 'Deleting'
      statusClass = 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}
      >
        {status}
      </span>
    )
  }

  const getQueueStats = () => {
    const messageCount = messages.length
    const avgMessageSize =
      messageCount > 0
        ? messages.reduce((sum, msg) => sum + msg.body.length, 0) / messageCount
        : 0

    let oldestMessageTime = 'N/A'
    if (messageCount > 0) {
      const timestamps = messages
        .map((msg) => msg.timestamp || 0)
        .filter((t) => t > 0)
      if (timestamps.length > 0) {
        const oldestTimestamp = Math.min(...timestamps)
        oldestMessageTime = new Date(oldestTimestamp).toLocaleString()
      }
    }

    return {
      messageCount,
      avgMessageSize: Math.round(avgMessageSize),
      oldestMessage: oldestMessageTime,
      activeRefresh: autoRefreshEnabled,
    }
  }

  const stats = getQueueStats()

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  )
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false)

  const toggleMessageDetails = (messageId: string) => {
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null)
    } else {
      setSelectedMessageId(messageId)
    }
  }

  const toggleProduceModal = () => {
    setIsProduceModalOpen(!isProduceModalOpen)
  }

  return (
    <div className="space-y-6">
      {/* Queue Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-end">
            <button
              id="produce-message-button"
              type="button"
              onClick={toggleProduceModal}
              className="hidden"
            >
              Produce Message
            </button>
          </div>
          <div className="mt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Messages Available
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                  {queueAttributes?.ApproximateNumberOfMessages || '0'}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Messages In Flight
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                  {queueAttributes?.ApproximateNumberOfMessagesNotVisible ||
                    '0'}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Delayed Messages
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                  {queueAttributes?.ApproximateNumberOfMessagesDelayed || '0'}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Queue Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {queueAttributes?.FifoQueue === 'true' ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                      FIFO
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Standard
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${stats.activeRefresh ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Auto-refresh: {stats.activeRefresh ? 'Active (5s)' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={toggleAutoRefresh}
                className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {autoRefreshEnabled ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => mutate()}
                disabled={loading}
                className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Messages
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Viewing messages in peek mode (messages remain in the queue)
              </p>
            </div>
            <div className="inline-flex shadow-sm rounded-md">
              <button
                type="button"
                onClick={() => setSortDirection('asc')}
                className={`relative inline-flex items-center px-3 py-1 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                  sortDirection === 'asc'
                    ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-100'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Oldest First
              </button>
              <button
                type="button"
                onClick={() => setSortDirection('desc')}
                className={`relative inline-flex items-center px-3 py-1 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                  sortDirection === 'desc'
                    ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-100'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Newest First
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-2 mb-4">
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div className="h-1 bg-indigo-600 dark:bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]"></div>
              </div>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
                Loading messages...
              </p>
            </div>
          )}

          {!loading && messages.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No messages available in this queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Offset
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Timestamp
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Message ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Preview
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {[...messages]
                    .sort((a, b) => {
                      const aTimestamp = a.timestamp || 0
                      const bTimestamp = b.timestamp || 0
                      return sortDirection === 'asc'
                        ? aTimestamp - bTimestamp
                        : bTimestamp - aTimestamp
                    })
                    .map((message, index) => {
                      let preview = '{}'
                      try {
                        const parsed = JSON.parse(message.body)
                        preview =
                          JSON.stringify(parsed).substring(0, 60) +
                          (JSON.stringify(parsed).length > 60 ? '...' : '')
                      } catch {
                        preview =
                          message.body.substring(0, 60) +
                          (message.body.length > 60 ? '...' : '')
                      }

                      return (
                        <Fragment key={message.id}>
                          <tr
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${selectedMessageId === message.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            onClick={() => toggleMessageDetails(message.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {message.timestamp
                                ? new Date(message.timestamp).toLocaleString()
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400 max-w-[350px] truncate">
                              {message.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getMessageStatus(message)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[300px] truncate font-mono">
                              {preview}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenRedriveModal(message)
                                }}
                                disabled={
                                  deadLetterSourceQueues.length === 0 ||
                                  redrivingMessageIds.has(message.id)
                                }
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 disabled:opacity-50 mr-4"
                              >
                                {redrivingMessageIds.has(message.id)
                                  ? 'Redriving...'
                                  : 'Redrive'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteMessage(message)
                                }}
                                disabled={deletingMessageIds.has(message.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                              >
                                {deletingMessageIds.has(message.id)
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>
                            </td>
                          </tr>
                          {selectedMessageId === message.id && (
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {formatMessageBody(message.body)}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Produce Message Side Drawer */}
      {isProduceModalOpen && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-900 opacity-50 dark:bg-gray-900 dark:opacity-75 transition-opacity"
              onClick={toggleProduceModal}
            ></div>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto relative w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Send Message to {queueName}
                      </h2>
                      <button
                        type="button"
                        onClick={toggleProduceModal}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close panel</span>
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter a JSON message to send to this queue.
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="dark:bg-gray-900 rounded-md overflow-hidden">
                        <AceEditor
                          mode="json"
                          theme="dracula"
                          value={messageInput}
                          onChange={(value) => {
                            setMessageInput(value)
                            validateJson(value)
                          }}
                          name="message-editor"
                          editorProps={{ $blockScrolling: true }}
                          setOptions={{
                            showLineNumbers: true,
                            tabSize: 2,
                            useWorker: false,
                          }}
                          width="100%"
                          height="300px"
                          fontSize={14}
                          showPrintMargin={false}
                          className={`rounded-md border ${isValidJson ? 'border-gray-300 dark:border-gray-600' : 'border-red-500 dark:border-red-500'}`}
                        />
                      </div>
                    </div>
                    {sendError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {sendError}
                      </div>
                    )}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => {
                          handleSendMessage()
                          if (!sendError) {
                            toggleProduceModal()
                          }
                        }}
                        disabled={
                          sendingMessage || !messageInput.trim() || !isValidJson
                        }
                        className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {sendingMessage ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <RedriveMessageModal
        key={selectedMessageForRedrive?.id}
        isOpen={!!selectedMessageForRedrive}
        message={selectedMessageForRedrive}
        deadLetterSourceQueues={deadLetterSourceQueues}
        isSubmitting={
          !!selectedMessageForRedrive &&
          redrivingMessageIds.has(selectedMessageForRedrive.id)
        }
        error={redriveError}
        onClose={handleCloseRedriveMessageModal}
        onConfirm={handleRedriveMessage}
      />
    </div>
  )
}
