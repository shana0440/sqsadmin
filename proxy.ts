import { withAuth } from 'next-auth/middleware';
import { NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(request: NextRequestWithAuth) {
    if (
      request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextauth.token
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }

        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|sqs.svg).*)'],
};
