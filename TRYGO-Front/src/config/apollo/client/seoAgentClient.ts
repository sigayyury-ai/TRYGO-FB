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
  
  // Используем Zustand stores для получения актуальных projectId и hypothesisId
  // Импортируем синхронно, так как это setContext
  let projectId = ''
  let hypothesisId = ''
  
  try {
    // Используем динамический импорт для избежания циклических зависимостей
    const { useProjectStore } = require('@/store/useProjectStore')
    const { useHypothesisStore } = require('@/store/useHypothesisStore')
    
    const activeProject = useProjectStore.getState().activeProject
    const activeHypothesis = useHypothesisStore.getState().activeHypothesis
    
    projectId = activeProject?.id || ''
    hypothesisId = activeHypothesis?.id || ''
    
    // Логирование для отладки (всегда, чтобы видеть что отправляется)
    if (projectId || hypothesisId) {
      console.log('[seoAgentClient] 📤 Sending headers:', {
        projectId,
        projectTitle: activeProject?.title || 'N/A',
        hypothesisId,
        hypothesisTitle: activeHypothesis?.title || 'N/A'
      });
    } else {
      console.warn('[seoAgentClient] ⚠️ No projectId or hypothesisId in headers!');
      console.warn('[seoAgentClient] activeProject:', activeProject);
      console.warn('[seoAgentClient] activeHypothesis:', activeHypothesis);
    }
  } catch (err) {
    // Fallback на localStorage, если stores недоступны
    projectId = localStorage.getItem('activeProjectId') || ''
    hypothesisId = localStorage.getItem('activeHypothesisId') || ''
  }

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

