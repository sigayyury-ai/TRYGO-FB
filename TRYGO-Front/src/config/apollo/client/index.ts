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
