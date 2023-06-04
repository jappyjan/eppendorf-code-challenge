import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {handlerLogic} from "./main";
import {APIGatewayProxyEventV2, Context} from "aws-lambda";

describe('main.ts', () => {
  describe('handlerLogic()', () => {
    it('should call removeOne and return a 204 status-code', async () => {
      const mockRepository = {
        removeOne: jest.fn(),
      } as unknown as DevicesRepository;

      const mockEvent = {
        pathParameters: {
          deviceId: 'device-id',
          deviceType: 'device-type',
        }
      } as Partial<APIGatewayProxyEventV2>;
      const mockContext = {} as unknown as Context;
      const mockCallback = jest.fn();

      await handlerLogic(mockRepository, mockEvent as APIGatewayProxyEventV2, mockContext, mockCallback);

      expect(mockRepository.removeOne).toHaveBeenCalledWith({
        PK: 'device-type',
        SK: 'device-id',
      });
      expect(mockCallback).toHaveBeenCalledWith(null, {
        statusCode: 204,
      });
    });
  });
});
