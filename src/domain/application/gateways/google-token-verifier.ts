export interface GoogleUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export default abstract class GoogleTokenVerifier {
  abstract verify(idToken: string): Promise<GoogleUserInfo>;
}
