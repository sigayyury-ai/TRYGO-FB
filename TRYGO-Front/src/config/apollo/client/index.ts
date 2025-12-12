import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Cookies from 'js-cookie'

// Main Backend - порт 5001 (см. PORTS.md)
// Используется для: авторизация, проекты, гипотезы, все НЕ-SEO Agent запросы
const mainBackendUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001/graphql'

const httpLink = new HttpLink({
  uri: mainBackendUrl,
  fetchOptions: {
    cache: 'no-store'
  },
  fetch: async (uri, options) => {
    try {
      const response = await fetch(uri, options);
      
      if (!response.ok && import.meta.env.DEV) {
        console.error('[Apollo Client] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          url: uri
        });
      }
      
      return response;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[Apollo Client] ❌ Fetch error:', error);
        console.error('[Apollo Client] Error details:', {
          message: error.message,
          name: error.name,
          uri,
          method: options?.method
        });
        
        if (error.message === 'Failed to fetch') {
          console.error('[Apollo Client] Network error - possible causes:');
          console.error('  1. Backend server not running on', mainBackendUrl);
          console.error('  2. CORS issue - check backend CORS configuration');
          console.error('  3. Network connectivity issue');
        }
      }
      
      throw error;
    }
  }
})

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get('token')


  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

const link = authLink.concat(httpLink)

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
})



export const MUTATE = client.mutate
export const QUERY = client.query
