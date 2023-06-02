import {model} from 'dynamoose';
import {devicesSchema} from "./devices.schema";
import {Document} from "dynamoose/dist/Document";
import {Device} from "@eppendorf-coding-challenge/data-interfaces";

export interface DeviceDocument extends Device, Document {}

export const DevicesModel = model<DeviceDocument>(
  'Devices',
  [
    devicesSchema
  ],
  {
    create: false,
    update: false,
    waitForActive: false,
  }
);
