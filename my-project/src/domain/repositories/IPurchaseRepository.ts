export interface IPurchaseRepository {
  create(produtoId: number, quantidade: number): Promise<void>;
  markReceived(produtoId: number): Promise<void>;
}
