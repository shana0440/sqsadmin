import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/auth/pre-signin')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const cognitoDomain = process.env.COGNITO_DOMAIN;
        const clientId = process.env.COGNITO_CLIENT_ID;

        if (!cognitoDomain || !clientId) {
          return new Response('Missing COGNITO_DOMAIN or COGNITO_CLIENT_ID', {
            status: 500,
          });
        }

        const url = new URL(request.url);
        const loginUrl = `${url.origin}/login?auto=true`;

        const logoutUrl = new URL(`https://${cognitoDomain}/logout`);
        logoutUrl.searchParams.set('client_id', clientId);
        logoutUrl.searchParams.set('logout_uri', loginUrl);

        return new Response(null, {
          status: 302,
          headers: { Location: logoutUrl.toString() },
        });
      },
    },
  },
});
