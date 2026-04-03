export interface ICepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  cidade: {
    id: number;
    descricao: string;
  };
}
