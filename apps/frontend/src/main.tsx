import {StrictMode} from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';
import {ReactQueryProvider} from "./providers";
import {ChakraProvider} from "./providers/chakra.provider";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <ReactQueryProvider>
      <ChakraProvider>
        <App/>
      </ChakraProvider>
    </ReactQueryProvider>
  </StrictMode>
);
