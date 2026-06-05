export interface IStockRepository {
  getQuantity(produtoId: number): Promise<number>;
  decrement(produtoId: number, quantity: number): Promise<void>;
  increment(produtoId: number, quantity: number): Promise<void>;
}
