import {handlerLogic} from "./main";
import {DevicesRepository} from "@eppendorf-coding-challenge/db-repositories";
import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {APIGatewayProxyEventV2, Context} from "aws-lambda";

describe('main.ts', () => {
  describe('handlerLogic()', () => {
    it('should call getAllDevices and return its response', async () => {
      const mockRepository = {
        getAllDevices: jest.fn().mockResolvedValueOnce([{
          id: '123',
        }] as unknown as Device[]),
      } as unknown as DevicesRepository;

      const mockEvent = {} as unknown as APIGatewayProxyEventV2;
      const mockContext = {} as unknown as Context;
      const mockCallback = jest.fn();

      await handlerLogic(mockRepository, mockEvent, mockContext, mockCallback);

      expect(mockRepository.getAllDevices).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(null, {
        statusCode: 200,
        body: JSON.stringify([{
          id: '123',
        }]),
      });
    });
  });
});
