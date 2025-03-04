/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNotEmpty, MinLength, IsEmpty } from 'class-validator';

export class CreateCountryDto {
  @IsEmpty({ message: 'You cannot pass user id' })
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;
}
