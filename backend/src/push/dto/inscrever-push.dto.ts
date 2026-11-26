import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

export class ChavesPushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  auth: string;
}

export class InscreverPushDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Endpoint inválido.' })
  @MaxLength(2000)
  endpoint: string;

  @ValidateNested()
  @Type(() => ChavesPushDto)
  keys: ChavesPushDto;
}
