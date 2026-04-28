import Cognito from '@auth/core/providers/cognito';
import { isUserAllowedToLogin } from '#/lib/config';
import type { StartAuthJSConfig } from 'start-authjs';

export const authConfig: StartAuthJSConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID ?? '',
      clientSecret: process.env.COGNITO_CLIENT_SECRET ?? '',
      issuer: process.env.COGNITO_ISSUER ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return !!user.email && isUserAllowedToLogin(user.email);
    },
  },
};
