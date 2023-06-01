import type {Context, Callback, APIGatewayEvent} from 'aws-lambda';
export function handler(event: APIGatewayEvent, context: Context, callback: Callback) {
  callback(null, {
    statusCode: 200,
    body: 'pong'
  });
}
