import {render, waitFor} from '@testing-library/react';
import {DevicesList} from "./devicesList";
import React from "react";
import {afterEach} from "vitest";
import nock from 'nock';
import mockDevices from './data/mock-device-list-response.json';
import {QueryClient, QueryClientProvider} from "react-query";
import fetch from 'node-fetch';
import {it, describe, expect} from 'vitest';
import {ChakraProvider} from "../../providers/chakra.provider";

/**
 * @vitest-environment jsdom
 */
describe('devicesList.spec.tsx', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  })
  const renderWithProviders = (children: JSX.Element) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </QueryClientProvider>
    );
  }

  const mockEndpoint = 'http://not.an.api.localhost:3333/api';
  let nockScope: nock.Scope;

  beforeEach(() => {
    process.env.VITE_API_ENDPOINT = mockEndpoint;

    nockScope = nock(mockEndpoint);

    global.fetch = fetch as typeof global.fetch;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('<DevicesList />', () => {
    it('should render 4 skeleton cards while data is fetching', async () => {
      nockScope
        .get('/devices')
        .delay(200)
        .reply(200, JSON.stringify([]));

      const {queryAllByTestId} = renderWithProviders(<DevicesList/>);

      await waitFor(() => expect(queryAllByTestId('skeleton-device-card').length).toBe(4));

      await waitFor(() => expect(queryAllByTestId('skeleton-device-card').length).toBe(0));
    });

    it('should render an error message if the request fails', async () => {
      nockScope
        .get('/devices')
        .reply(500);

      const {getByText} = renderWithProviders(<DevicesList/>);

      await waitFor(() => expect(getByText('Could not load devices.')).toBeTruthy());
    });

    it('should render fetched devices', async () => {
      const devices: unknown[] = mockDevices;

      nockScope
        .get('/devices')
        .reply(200, JSON.stringify(devices));

      const {getAllByTestId} = renderWithProviders(<DevicesList/>);

      await waitFor(() => expect(getAllByTestId('device-card').length).toBe(devices.length));
    });
  });
});
