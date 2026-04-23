import { useState, useEffect } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/' })
    }
  },
  component: Login,
})

function Login() {
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/csrf')
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
  }, [])

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="text-center mb-8">
        <img
          src="/sqs.svg"
          alt="SQS Logo"
          width={64}
          height={64}
          className="mx-auto rounded-md mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sign in to SQS Admin
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your Amazon SQS queues
        </p>
      </div>

      <div className="space-y-4">
        <form action="/api/auth/signin/cognito" method="POST">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value="/" />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Continue with Cognito
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          You'll be redirected to sign in.
        </p>
      </div>
    </div>
  )
}
