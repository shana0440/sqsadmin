import { getServerSession, NextAuthOptions } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';
import { isUserAllowedToLogin } from '@/app/lib/config';

const cognitoClientId = process.env.COGNITO_CLIENT_ID ?? '';
const cognitoClientSecret = process.env.COGNITO_CLIENT_SECRET ?? '';
const cognitoIssuer = process.env.COGNITO_ISSUER ?? '';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CognitoProvider({
      clientId: cognitoClientId,
      clientSecret: cognitoClientSecret,
      issuer: cognitoIssuer,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return !!user.email && isUserAllowedToLogin(user.email);
    },
  },
};

export async function authUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  return email;
}
