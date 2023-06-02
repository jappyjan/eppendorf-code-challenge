import {Schema} from "dynamoose";

export const devicesSchema = new Schema({
  // type
  PK: {
    type: String,
    hashKey: true,
    required: true,
  },
  // id
  SK: {
    type: String,
    rangeKey: true,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  device_health: {
    type: String,
    required: true,
  },
  last_used: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
}, {
  saveUnknown: false,
  timestamps: true,
});
