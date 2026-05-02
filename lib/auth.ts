import type { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";

const kakaoClientId =
  process.env.KAKAO_CLIENT_ID ?? process.env.KAKAO_REST_API_KEY ?? "";
const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET ?? "";
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: kakaoClientId,
      clientSecret: kakaoClientSecret,
    }),
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
        token.oauthId = account.providerAccountId;
      }

      // 혹시 providerAccountId가 비어있는 경우 fallback
      if (!token.oauthId && profile) {
        token.oauthId =
          (profile as { id?: string; sub?: string }).id ??
          (profile as { id?: string; sub?: string }).sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { provider?: string; id?: string }).provider =
          token.provider as string | undefined;
        (session.user as { provider?: string; id?: string }).id =
          token.oauthId as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
