import { ApolloProvider } from '@apollo/client';
import { client } from '../../config/apollo/client';

export const ApolloAppProvider = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
