export interface ICustomerRepository {
  findByCpf(cpf: string): Promise<{ id: number } | null>;
  upsert(data: { cpf: string; nome: string; email: string; telefone: string }): Promise<{ id: number }>;
}
