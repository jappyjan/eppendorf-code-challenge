import {model} from 'dynamoose';
import {deviceSchema} from "./device.schema";
import {Document} from "dynamoose/dist/Document";

class Device extends Document {
  id!: number;
  location!: string;
  type!: string;
  device_health!: string;
  last_used!: Date;
  price!: number;
  color!: string;
}

export const DeviceModel = model<Device>(
  'Device',
  [
    deviceSchema
  ],
  {
    create: false,
    update: false,
    waitForActive: false,
  }
);
