export type AuthRole = 'doctor' | 'client-admin' | 'super-admin';

export interface AuthSession {
  userId: string;
  role: AuthRole;
  displayName: string;
}
