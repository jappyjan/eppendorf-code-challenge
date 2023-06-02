import {DevicesRepository} from './devices.repository';
import {Model} from "dynamoose/dist/Model";
import * as seed from 'data/seed.json';
import type {DeviceDocument} from "@eppendorf-coding-challenge/dynamodb";

describe('devices.repository.ts', () => {
  describe('DevicesRepository', () => {
    it('should take a Dynamoose Model as a constructor parameter', () => {
      const model = {} as Model<DeviceDocument>;
      const repository = new DevicesRepository(model);
      expect(repository).toBeDefined();
    });

    it('should have a method to get all devices', () => {
      const model = {} as Model<DeviceDocument>;
      const repository = new DevicesRepository(model);
      expect(repository.getAllDevices).toBeDefined();
    });

    describe('getAllDevices', () => {
      const seedDevices = seed.map((item) => ({
        ...item,
        PK: item.type,
        SK: item.id,
      }));

      it('should call the scan method on the model', async () => {
        const scanMock = jest.fn().mockReturnThis();
        const allMock = jest.fn().mockReturnThis();
        const execMock = jest.fn().mockResolvedValue({});

        const model = {
          scan: scanMock,
          all: allMock,
          exec: execMock,
        } as unknown as Model<DeviceDocument>;

        const repository = new DevicesRepository(model);
        await repository.getAllDevices();

        expect(scanMock).toHaveBeenCalled();
        expect(allMock).toHaveBeenCalled();
        expect(execMock).toHaveBeenCalled();
      });

      it('should return the items from the scan', async () => {
        const scanMock = jest.fn().mockReturnThis();
        const allMock = jest.fn().mockReturnThis();
        const execMock = jest.fn().mockResolvedValue(seedDevices);

        const model = {
          scan: scanMock,
          all: allMock,
          exec: execMock,
        } as unknown as Model<DeviceDocument>;

        const repository = new DevicesRepository(model);
        const result = await repository.getAllDevices();

        expect(result).toEqual(seedDevices);
      });
    });
  });
});
