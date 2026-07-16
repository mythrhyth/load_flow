import { IsOptional, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';

export class UpdateLoadDto {
  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  originAddress?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @IsString()
  @IsOptional()
  pickupWindow?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  deliveryWindow?: string;

  @IsString()
  @IsOptional()
  commodity?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  declaredValue?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  equipment?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  shipperId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['posted', 'assigned', 'rate-confirmed', 'dispatched', 'in-transit', 'delivered', 'pod-verified', 'closed'])
  status?: string;

  @IsString()
  @IsOptional()
  carrierId?: string;

  @IsString()
  @IsOptional()
  priority?: string;
}
