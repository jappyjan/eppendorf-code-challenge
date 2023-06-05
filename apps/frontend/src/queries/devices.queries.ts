import {MutationOptions, useMutation, useQuery, useQueryClient, UseQueryOptions} from "react-query";
import type {Device} from "@eppendorf-coding-challenge/data-interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonDeviceToModel(jsonDevice: any): Device {
  return {
    ...jsonDevice,
    last_used: new Date(jsonDevice.last_used),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function modelDeviceToJson(device: Device): any {
  return {
    ...device,
    last_used: device.last_used.getTime(),
  };
}

async function handleErrorResponse(response: Response) {
  if (!(response.status < 200 || response.status >= 300)) {
    return;
  }

  console.error('request failed, response: ', await response.clone().text());

  const parsed = await response.clone().json().catch(() => undefined);

  if (parsed) {
    throw new Error(parsed.message);
  }

  throw new Error('Request failed with status code ' + response.status);
}

async function fetchAllDevices() {
  const apiEndpoint: string = import.meta.env.VITE_API_ENDPOINT;
  const response = await fetch(`${apiEndpoint}/devices`);

  await handleErrorResponse(response);

  const rawDevices = await response.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rawDevices.map((rawDevice: any) => ({
    ...jsonDeviceToModel(rawDevice),
    price: rawDevice.price / 100,
  } as Device));
}

export function useDevices(options?: UseQueryOptions<Array<Device>>) {
  let initialDevices: Array<Device> = [];
  let initialFetchedAt = 0;

  try {
    const savedState = JSON.parse(localStorage.getItem('devices') || '{}');
    if (savedState) {
      initialDevices = (savedState.devices || []).map(jsonDeviceToModel);
      initialFetchedAt = savedState.fetchedAt || 0;
    }
  } catch (e) {
    console.error(e);
    localStorage.removeItem('devices');
  }

  return useQuery<Array<Device>>(
    {
      queryKey: ['GET /devices'],
      queryFn: () => fetchAllDevices(),
      initialData: initialDevices,
      initialDataUpdatedAt: initialFetchedAt,
      ...options,
      onSuccess: (devices) => {
        localStorage.setItem('devices', JSON.stringify({
          devices: devices.map(modelDeviceToJson),
          fetchedAt: Date.now(),
        }));
        options?.onSuccess?.(devices);
      },
    }
  );
}


async function upsertDevice(device: Device) {
  const apiEndpoint: string = import.meta.env.VITE_API_ENDPOINT;
  const response = await fetch(`${apiEndpoint}/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(modelDeviceToJson(device)),
  });

  await handleErrorResponse(response);

  const rawDevice = await response.json();

  return jsonDeviceToModel(rawDevice);
}

export function useUpsertDeviceMutation(options?: MutationOptions<Device, unknown, Device>) {
  const queryClient = useQueryClient();

  return useMutation({
      ...options,
      mutationFn: (device: Device) => upsertDevice(device),
      mutationKey: ['POST /devices'],
      onSuccess: (data, variables, context) => {
        queryClient.setQueryData<Device[]>(['GET /devices'], (oldDevices) => {
          if (!oldDevices) {
            return [data];
          }

          const index = oldDevices.findIndex((device) => device.id === data.id);
          if (index !== -1) {
            oldDevices[index] = data;
          } else {
            oldDevices.push(data);
          }
          return oldDevices;
        });
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    }
  );
}

async function deleteDevice(deviceIdentifier: Pick<Device, 'id' | 'type'>) {
  const apiEndpoint: string = import.meta.env.VITE_API_ENDPOINT;
  const response = await fetch(`${apiEndpoint}/devices/${deviceIdentifier.type}/${deviceIdentifier.id}`, {
    method: 'DELETE',
  });

  await handleErrorResponse(response);
}

export function useDeleteDeviceMutation(options?: MutationOptions<unknown, unknown, Pick<Device, 'id' | 'type'>>) {
  const queryClient = useQueryClient();

  return useMutation({
      ...options,
      mutationFn: (deviceIdentifier: Pick<Device, 'id' | 'type'>) => deleteDevice(deviceIdentifier),
      mutationKey: ['DELETE /devices'],
      onSuccess: (data, variables, context) => {
        queryClient.setQueryData<Device[]>(['GET /devices'], (oldDevices) => {
          if (!oldDevices) {
            return [];
          }

          const index = oldDevices.findIndex((device) => device.id === variables.id);
          if (index !== -1) {
            oldDevices.splice(index, 1);
          }
          return oldDevices;
        });
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    }
  );
}
