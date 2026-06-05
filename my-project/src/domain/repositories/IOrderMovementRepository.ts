export interface IOrderMovementRepository {
  register(produtoId: number, pedidoId: number, quantidade: number): Promise<void>;
}
