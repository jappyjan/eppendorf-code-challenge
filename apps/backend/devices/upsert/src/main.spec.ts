import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {handlerLogic} from "./main";
import {APIGatewayProxyEventV2, Context} from "aws-lambda";

describe('main.ts', () => {
  describe('handlerLogic()', () => {
    it('should call the upsertDevice() method of the devicesRepository with the device data from the event and return the result', async () => {
      const mockRepository = {
        upsertDevice: jest.fn().mockResolvedValueOnce([{
          id: 'db-id',
        }] as unknown as Device[]),
      } as unknown as DevicesRepository;

      const mockEvent = {
        body: JSON.stringify({
          id: 'event-id',
          type: 'event-type',
        }),
      } as Partial<APIGatewayProxyEventV2>;

      const mockContext = {} as unknown as Context;
      const mockCallback = jest.fn();

      await handlerLogic(mockRepository, mockEvent as APIGatewayProxyEventV2, mockContext, mockCallback);

      expect(mockRepository.upsertDevice).toHaveBeenCalledWith({
        PK: 'event-type',
        SK: 'event-id',
        id: 'event-id',
        type: 'event-type',
      });
      expect(mockCallback).toHaveBeenCalledWith(null, {
        statusCode: 200,
        body: JSON.stringify([{
          id: 'db-id',
        }]),
      });
    });
  });
});
