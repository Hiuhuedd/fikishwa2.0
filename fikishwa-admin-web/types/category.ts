export interface VehicleCategory {
  categoryId: string;
  name: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  maxPassengers: number;
  isActive: boolean;
  image?: string;
  description?: string;
}
