import "source-map-support/register";
import type {Context, Callback, APIGatewayEvent} from 'aws-lambda';
import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {DevicesModel} from "@eppendorf-coding-challenge/dynamodb";

export async function handler(event: APIGatewayEvent, context: Context, callback: Callback) {
  const repo = new DevicesRepository(DevicesModel);
  const devices = await repo.getAllDevices();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(devices),
  });
}
