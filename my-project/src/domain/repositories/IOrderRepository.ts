export interface IOrderRepository {
  create(data: { orderId: string; clienteId: number; data: Date; valorTotal: number; status: string }): Promise<{ id: number }>;
  updateStatus(pedidoId: number, status: string): Promise<void>;
}
