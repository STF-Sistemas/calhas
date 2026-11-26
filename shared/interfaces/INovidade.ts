/** Uma versão publicada do sistema e o que mudou nela (tela de Novidades). */
export interface INovidade {
  /** Versão no formato semver, ex.: "1.7.0" */
  versao: string;
  /** Data no formato dd/mm/aaaa */
  data: string;
  /** Itens em linguagem do usuário (o que mudou e por quê), não termos técnicos */
  itens: string[];
}
