import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsOptional()
  originAddress?: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @IsDateString()
  @IsNotEmpty()
  pickupDate: string;

  @IsString()
  @IsOptional()
  pickupWindow?: string;

  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string;

  @IsString()
  @IsOptional()
  deliveryWindow?: string;

  @IsString()
  @IsNotEmpty()
  commodity: string;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsNumber()
  @IsOptional()
  declaredValue?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsNotEmpty()
  equipment: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  shipperId?: string;
}
