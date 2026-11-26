import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AutorizarDto {
  @IsString({ message: 'Assinatura em formato inválido.' })
  @MinLength(100, { message: 'Assinatura em formato inválido.' })
  @MaxLength(700_000, { message: 'Assinatura muito grande.' })
  @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, { message: 'Assinatura em formato inválido.' })
  assinatura: string;
}
