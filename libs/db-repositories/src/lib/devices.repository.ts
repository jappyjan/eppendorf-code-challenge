import type {DeviceDocument} from "@eppendorf-coding-challenge/dynamodb";
import type {Model} from "dynamoose/dist/Model";

export class DevicesRepository {
  private model: Model<DeviceDocument>

  public constructor(model: Model<DeviceDocument>) {
    this.model = model;
  }

  public async getAllDevices() {
    const scanResult = await this.model.scan().all().exec();

    // copying to new array to get rid of dynamoose methods and properties
    return Array.from(scanResult);
  }
}
