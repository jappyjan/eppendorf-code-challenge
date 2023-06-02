import {render, waitFor} from '@testing-library/react';
import {DevicesList} from "./devicesList";
import React from "react";
import {beforeAll} from "vitest";
import nock from 'nock';
import mockDevices from './data/mock-device-list-response.json';
import {QueryClient, QueryClientProvider} from "react-query";
import fetch from 'node-fetch';

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
  const wrapper = (children: JSX.Element) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockEndpoint = 'http://not.an.api.localhost:3333/api';
  let nockScope: nock.Scope;

  beforeAll(() => {
    process.env.VITE_API_ENDPOINT = mockEndpoint;

    nockScope = nock(mockEndpoint);

    global.fetch = fetch as never;
  });

  describe('<DevicesList />', () => {
    it('should render 4 skeleton cards while data is fetching', async () => {
      nockScope
        .get('/devices')
        .delay(1000)
        .reply(200, JSON.stringify([]));

      const {queryAllByTestId} = render(wrapper(<DevicesList />));

      await waitFor(() => expect(queryAllByTestId('skeleton-device-card').length).toBe(4), {
        timeout: 2000
      });

      await waitFor(() => expect(queryAllByTestId('skeleton-device-card').length).toBe(0), {
        timeout: 2000
      });
    });

    it('should render an error message if the request fails', async () => {
      nockScope
        .get('/devices')
        .reply(500);

      const {getByText} = render(wrapper(<DevicesList />));

      await waitFor(() => expect(getByText('Could not load devices.')).toBeTruthy(), {
        timeout: 15000
      });
    });

    it('should render fetched devices', async () => {
      const devices: unknown[] = mockDevices;

      nockScope
        .get('/devices')
        .reply(200, JSON.stringify(devices));

      const {getAllByTestId} = render(wrapper(<DevicesList />));

      await waitFor(() => expect(getAllByTestId('device-card').length).toBe(devices.length), {
        timeout: 2000
      });
    });
  });
}, {
  timeout: 20000
});
