import {useQuery, UseQueryOptions} from "react-query";
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

export async function fetchAllDevices() {
  const apiEndpoint: string = import.meta.env.VITE_API_ENDPOINT;
  const response = await fetch(`${apiEndpoint}/devices`);

  const rawDevices = await response.clone().json();

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
