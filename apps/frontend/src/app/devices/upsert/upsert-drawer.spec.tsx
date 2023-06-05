import {UpsertDrawer} from "./upsert-drawer";
import {fireEvent, render, waitFor} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "react-query";
import {it, describe, expect, afterEach} from 'vitest';
import nock from "nock";
import fetch from "node-fetch";
import {Device} from "@eppendorf-coding-challenge/data-interfaces";

function renderWithProviders(children: JSX.Element) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * @vitest-environment jsdom
 */
describe('upsert-drawer.tsx', () => {
  describe('<UpsertDrawer />', () => {
    const MOCK_API_ENDPOINT = 'http://not-an-apilocalhost:3000';
    let nockScope: nock.Scope;

    beforeEach(() => {
      process.env.VITE_API_ENDPOINT = MOCK_API_ENDPOINT;

      nockScope = nock(MOCK_API_ENDPOINT);

      global.fetch = fetch as typeof global.fetch;
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should render successfully', () => {
      const onClose = vi.fn();
      const {baseElement} = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={false}/>);
      expect(baseElement).toBeTruthy();
    });

    it('should render the create title when originalDevice is not provided', () => {
      const onClose = vi.fn();
      const {getByTestId} = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={true}/>);
      const header = getByTestId('upsert-drawer-header');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(header).toHaveTextContent('Create new device');
    });

    it('should render the edit title when originalDevice is provided', () => {
      const onClose = vi.fn();
      const mockDevice: Device = {
        PK: '',
        SK: '',
        id: 10,
        type: 'test_type',
        device_health: 'mediocre',
        price: 55.44,
        color: '#ff0022',
        location: 'test_location',
        last_used: new Date(),
      };
      const {getByTestId} = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={true}
                                                              originalDevice={mockDevice}/>);
      const header = getByTestId('upsert-drawer-header');

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(header).toHaveTextContent('Edit test_type #10');
    });

    it('should call onClose when the cancel button is clicked', async () => {
      const onClose = vi.fn();
      const {getByTestId} = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={true}/>);
      const closeButton = getByTestId('upsert-drawer-cancel-button');
      closeButton.click();
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('should only be visible when isOpen is true', () => {
      const onClose = vi.fn();
      const renderMethodsForClosedDrawer = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={false}/>);
      const closedForm = renderMethodsForClosedDrawer.queryByTestId('upsert-drawer-form');
      expect(closedForm).toBeNull();

      const renderMethodsForOpenedDrawer = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={true}/>);
      const openedForm = renderMethodsForOpenedDrawer.queryByTestId('upsert-drawer-form');
      expect(openedForm).not.toBeNull();
    });

    it('should call upsertDevice with the correct body when the save button is clicked and then close the drawer', async () => {
      const postResponseMock = vi.fn();
      nockScope.post('/devices')
        .reply(200, (_uri, body) => {
          postResponseMock(body);
          return {
            ...body as Device,
            PK: 'new-pk',
            SK: 'new-sk',
          }
        });

      const onClose = vi.fn();
      const {getByTestId} = renderWithProviders(<UpsertDrawer onClose={onClose} isOpen={true}/>);

      const updatedDevice: Omit<Device, 'PK' | 'SK' | 'last_used'> = {
        id: 23,
        type: 'pipette',
        device_health: 'bad',
        price: 55.44,
        color: '#ff0022',
        location: 'test_location',
      };

      const idInput = getByTestId('upsert-drawer-id-input') as HTMLInputElement;
      fireEvent.change(idInput, {target: {value: updatedDevice.id}});

      const typeInput = getByTestId('upsert-drawer-type-input') as HTMLInputElement;
      fireEvent.change(typeInput, {target: {value: updatedDevice.type}});

      const locationInput = getByTestId('upsert-drawer-location-input') as HTMLInputElement;
      fireEvent.change(locationInput, {target: {value: updatedDevice.location}});

      const deviceHealthInput = getByTestId('upsert-drawer-health-input') as HTMLInputElement;
      fireEvent.change(deviceHealthInput, {target: {value: updatedDevice.device_health}});

      const colorInput = getByTestId('upsert-drawer-color-input') as HTMLInputElement;
      fireEvent.change(colorInput, {target: {value: updatedDevice.color}});

      const priceInput = getByTestId('upsert-drawer-price-input') as HTMLInputElement;
      fireEvent.change(priceInput, {target: {value: updatedDevice.price}});

      const saveButton = getByTestId('upsert-drawer-save-button');
      saveButton.click();

      await waitFor(() => expect(onClose).toHaveBeenCalled());

      const expectedBody = {
        ...updatedDevice,
        last_used: expect.any(Number),
        PK: '',
        SK: '',
      };
      await waitFor(() => expect(postResponseMock).toHaveBeenCalledWith(expectedBody));
    });
  });
});
