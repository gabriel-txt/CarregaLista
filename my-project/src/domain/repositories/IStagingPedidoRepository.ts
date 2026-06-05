export interface IStagingPedidoRepository {
  createMany(data: Array<Record<string, unknown>>): Promise<number>;
  findAll(): Promise<Array<Record<string, unknown>>>;
  clearAll(): Promise<void>;
}
