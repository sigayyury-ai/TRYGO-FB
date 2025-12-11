import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Cookies from 'js-cookie'
import { getActiveIds } from '@/utils/activeState'
import { useUserStore } from '@/store/useUserStore'

// SEO Agent uses a separate backend service
const seoAgentUrl = import.meta.env.VITE_SEO_AGENT_URL || 'http://localhost:4100/graphql'

const httpLink = new HttpLink({
  uri: seoAgentUrl,
  fetchOptions: {
    cache: 'no-store'
  },
  fetch: async (uri, options) => {
    try {
      const response = await fetch(uri, options);
      
      if (!response.ok && import.meta.env.DEV) {
        console.error('[seoAgentClient] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          url: uri
        });
      }
      
      return response;
    } catch (error: any) {
      // Always log errors, but with less detail in production
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        console.error('[seoAgentClient] ❌ Fetch error:', error);
        console.error('[seoAgentClient] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          uri,
          method: options?.method,
          cause: error.cause
        });
        
        // Provide more helpful error message
        if (error.message === 'Failed to fetch') {
          console.error('[seoAgentClient] Network error - possible causes:');
          console.error('  1. Backend server not running on', seoAgentUrl);
          console.error('  2. CORS issue - check backend CORS configuration');
          console.error('  3. Network connectivity issue');
          console.error('  4. Firewall blocking the request');
        }
      } else {
        // Minimal error logging in production
        console.error('[seoAgentClient] Request failed:', error.message);
      }
      
      throw error;
    }
  }
})

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get('token')
  
  // Используем утилиту для получения активных ID из cookies
  const { projectId, hypothesisId } = getActiveIds()
  
  // Получаем userId из userStore (Zustand store)
  const userData = useUserStore.getState().userData
  const userId = userData?.id || Cookies.get('userId') || localStorage.getItem('userId')
  
  // Removed logging - only log critical errors to prevent memory issues
  // Missing projectId/hypothesisId will be handled by backend validation

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-project-id': projectId || '',
      'x-hypothesis-id': hypothesisId || '',
      ...(userId && { 'x-user-id': userId })
    }
  }
})

const link = authLink.concat(httpLink)

export const seoAgentClient = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

export const SEO_AGENT_MUTATE = seoAgentClient.mutate
export const SEO_AGENT_QUERY = seoAgentClient.query

