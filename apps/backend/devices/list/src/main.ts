import "source-map-support/register";
import type {Context, Callback, APIGatewayProxyEventV2} from 'aws-lambda';
import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {DevicesModel} from "@eppendorf-coding-challenge/dynamodb";

export async function handlerLogic(devicesRepository: DevicesRepository, event: APIGatewayProxyEventV2, context: Context, callback: Callback) {
  const devices = await devicesRepository.getAllDevices();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(devices),
  });
}

export function makeHandler(devicesRepository: DevicesRepository) {
  return (event: APIGatewayProxyEventV2, context: Context, callback: Callback) => {
    return handlerLogic(devicesRepository, event, context, callback);
  }
}

export const handler = makeHandler(new DevicesRepository(DevicesModel));
