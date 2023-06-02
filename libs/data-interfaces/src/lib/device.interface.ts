export interface Device {
  PK: string;
  SK: string;
  id: number;
  location: string;
  type: string;
  device_health: string;
  last_used: Date;
  price: number;
  color: string;
}
