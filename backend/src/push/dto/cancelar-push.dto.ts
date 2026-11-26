import { IsUrl, MaxLength } from 'class-validator';

export class CancelarPushDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Endpoint inválido.' })
  @MaxLength(2000)
  endpoint: string;
}
