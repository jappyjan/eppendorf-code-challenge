import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 2, // 2 minutes
      staleTime: 1000 * 60 * 2, // 1 minutes
    }
  }
});

interface Props {
  children: React.ReactNode;
}

export function ReactQueryProvider(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
