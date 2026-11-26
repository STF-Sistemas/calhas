import { Inteiro, Numero, Texto, TextoOpcional } from '../../common/validadores';

export class ProdutoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Texto(10, 'Unidade de medida é obrigatória.')
  unidade_medida: string;

  @Numero({ min: 0, mensagem: 'Valor unitário inválido.' })
  valor_unitario: number;

  @Numero({ opcional: true, min: 0, mensagem: 'Custo inválido.' })
  custo?: number | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Markup inválido.' })
  markup?: number | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Estoque inválido.' })
  estoque_atual?: number | null;

  @TextoOpcional(10) ncm?: string | null;
  @TextoOpcional(7) cest?: string | null;
  @TextoOpcional(14) gtin?: string | null;
  @TextoOpcional(5) cfop_padrao?: string | null;

  @Inteiro({ opcional: true, min: 0, max: 8, mensagem: 'Origem inválida.' })
  origem?: number | null;
}
