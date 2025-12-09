import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Cookies from 'js-cookie'

// SEO Agent uses a separate backend service
const seoAgentUrl = import.meta.env.VITE_SEO_AGENT_URL || 'http://localhost:4100/graphql'

const httpLink = new HttpLink({
  uri: seoAgentUrl,
  fetchOptions: {
    cache: 'no-store'
  }
})

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get('token')
  const projectId = localStorage.getItem('activeProjectId')
  const hypothesisId = localStorage.getItem('activeHypothesisId')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-project-id': projectId || '',
      'x-hypothesis-id': hypothesisId || ''
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

