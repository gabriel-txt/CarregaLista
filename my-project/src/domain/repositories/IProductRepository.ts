export interface IProductRepository {
  findBySku(sku: string): Promise<{ id: number; sku: string } | null>;
  upsert(data: { sku: string; nome: string; preco: number }): Promise<{ id: number }>; 
}
