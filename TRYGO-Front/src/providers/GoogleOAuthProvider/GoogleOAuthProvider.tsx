import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthProviderProps {
  children: ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('Google Client ID is not configured');
    return <>{children}</>;
  }

  return <GoogleProvider clientId={clientId}>{children}</GoogleProvider>;
}

