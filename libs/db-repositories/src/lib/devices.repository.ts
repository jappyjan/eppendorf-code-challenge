import type {DeviceDocument} from "@eppendorf-coding-challenge/dynamodb";
import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {ModelType} from "dynamoose/dist/General";

export type UpsertDeviceData = Partial<Device> & Pick<Device, 'PK' | 'SK'>;

export class DevicesRepository {
  private model: ModelType<DeviceDocument>

  public constructor(model: ModelType<DeviceDocument>) {
    this.model = model;
  }

  public async getAllDevices() {
    const scanResult = await this.model.scan().all().exec();

    // copying to new array to get rid of dynamoose methods and properties
    return Array.from(scanResult);
  }

  public async upsertDevice(deviceData: UpsertDeviceData): Promise<Device> {
    const deviceDocument = new this.model(deviceData);

    return await deviceDocument.save({
      return: 'document',
    }) as DeviceDocument
  }
}
