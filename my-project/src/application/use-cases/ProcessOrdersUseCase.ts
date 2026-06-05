import eventBus from '../../infrastructure/jobs/event-bus';
import OrderProcessingService from '../../domain/services/OrderProcessingService';
import prisma from '../../infrastructure/prisma/client';

class ProcessOrdersUseCase {
  async schedule(batchCount: number) {
    eventBus.emit('processOrders', { batchCount });
  }

  async execute() {
    const stagingRecords = await prisma.stagingPedido.findMany();
    if (!stagingRecords.length) {
      return;
    }

    const groupedByOrder = new Map<string, Array<typeof stagingRecords[number]>>();
    for (const row of stagingRecords) {
      const orderKey = row.orderId;
      const items = groupedByOrder.get(orderKey) ?? [];
      items.push(row);
      groupedByOrder.set(orderKey, items);
    }

    const ordersToProcess = Array.from(groupedByOrder.entries()).map(([orderId, rows]) => {
      return {
        orderId,
        valorTotal: rows.reduce((sum, item) => sum + Number(item.itemPrice) * item.quantity, 0),
        clienteEmail: rows[0].buyerEmail,
        clienteNome: rows[0].buyerName,
        cpf: rows[0].cpf,
        data: rows[0].purchaseDate,
        items: rows.map((row) => ({ sku: row.sku, quantidade: row.quantity, productName: row.productName, itemPrice: row.itemPrice })),
      };
    });

    const service = new OrderProcessingService(prisma);
    await service.processOrders(ordersToProcess);
  }
}

export default ProcessOrdersUseCase;
