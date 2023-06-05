import "source-map-support/register";
import type {Context, Callback, APIGatewayProxyEventV2} from 'aws-lambda';
import {DevicesRepository, UpsertDeviceData} from "@eppendorf-coding-challenge/db-repositories";
import {DevicesModel} from "@eppendorf-coding-challenge/dynamodb";

function getDeviceDataFromEvent(event: APIGatewayProxyEventV2): UpsertDeviceData {
  const parsed = JSON.parse(event.body);

  const PK = String(parsed.PK ?? parsed.type);
  if (!PK) throw new Error('PK or type is required');

  const SK = String(parsed.SK ?? parsed.id);
  if (!SK) throw new Error('SK or id is required');

  let last_used: Date | undefined;
  if (parsed.last_used) {
    last_used = new Date(parsed.last_used);

    if (isNaN(last_used.getTime())) {
      throw new Error('last_used is not a valid date');
    }
  }

  return {
    PK,
    SK,
    id: parsed.id,
    type: parsed.type,
    location: parsed.location,
    device_health: parsed.device_health,
    color: parsed.color,
    price: parsed.price,
    last_used,
  }
}

export async function handlerLogic(devicesRepository: DevicesRepository, event: APIGatewayProxyEventV2, context: Context, callback: Callback) {
  let deviceDataFromEvent: UpsertDeviceData;
  try {
    deviceDataFromEvent = getDeviceDataFromEvent(event);
  } catch (e) {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({error: e.message}),
    });
  }
  const updatedDevice = await devicesRepository.upsertDevice(deviceDataFromEvent);

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(updatedDevice),
  });
}

export function makeHandler(devicesRepository: DevicesRepository) {
  return (event: APIGatewayProxyEventV2, context: Context, callback: Callback) => {
    return handlerLogic(devicesRepository, event, context, callback);
  }
}

export const handler = makeHandler(new DevicesRepository(DevicesModel));
