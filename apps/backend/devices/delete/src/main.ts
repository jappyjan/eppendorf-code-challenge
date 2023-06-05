import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {APIGatewayProxyEventV2, Context, Callback} from "aws-lambda";
import {DevicesModel} from "@eppendorf-coding-challenge/dynamodb";
import {APIGatewayProxyResultV2} from "aws-lambda/trigger/api-gateway-proxy";

export async function handlerLogic(devicesRepository: DevicesRepository, event: APIGatewayProxyEventV2, context: Context, callback: Callback) {
  const {deviceId, deviceType} = event.pathParameters;

  await devicesRepository.removeOne({
    PK: deviceType,
    SK: deviceId,
  });
  callback(null, {
    statusCode: 204,
  });
}

function makeHandler(devicesRepository: DevicesRepository) {
  return async function (event: APIGatewayProxyEventV2, context: Context, callback: Callback) {
    await handlerLogic(devicesRepository, event, context, callback);
  };
}

export const handler = makeHandler(new DevicesRepository(DevicesModel));
