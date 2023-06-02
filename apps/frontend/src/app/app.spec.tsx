import {render} from '@testing-library/react';

import App from './app';
import {ReactQueryProvider} from "../providers";

describe('App', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <ReactQueryProvider>
        <App/>
      </ReactQueryProvider>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have the application name shown', () => {
    const {getByText} = render(
      <ReactQueryProvider>
        <App/>
      </ReactQueryProvider>
    );
    expect(getByText(/Eppendorf/gi)).toBeTruthy();
  });
});
