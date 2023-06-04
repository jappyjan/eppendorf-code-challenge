import {render, waitFor} from '@testing-library/react';

import App from './app';
import {ReactQueryProvider} from "../providers";

describe('App', () => {
  it('should render successfully', async () => {
    const {baseElement} = render(
      <ReactQueryProvider>
        <App/>
      </ReactQueryProvider>
    );
    await waitFor(() => expect(baseElement).toBeTruthy());
  });

  it('should have the application name shown', async () => {
    const {getByText} = render(
      <ReactQueryProvider>
        <App/>
      </ReactQueryProvider>
    );
    await waitFor(() => expect(getByText('Eppendorf')).toBeTruthy());
  });
});
