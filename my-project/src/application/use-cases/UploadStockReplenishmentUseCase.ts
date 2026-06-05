import { parse } from 'csv-parse/sync';
import prisma from '../../infrastructure/prisma/client';

class UploadStockReplenishmentUseCase {
  async execute(csv: string) {
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    for (const row of records) {
      const sku = row.sku?.trim();
      const quantity = Number(row.quantity ?? row['quantity'] ?? row['quantity-delivered']);
      if (!sku || Number.isNaN(quantity)) {
        continue;
      }

      const product = await prisma.produto.findUnique({ where: { sku } });
      if (!product) {
        continue;
      }

      await prisma.estoque.upsert({
        where: { produtoId: product.id },
        create: { produtoId: product.id, quantidade: quantity },
        update: { quantidade: { increment: quantity } },
      });

      await prisma.compra.updateMany({
        where: { produtoId: product.id, status: 'Pendente' },
        data: { status: 'Recebido' },
      });
    }
  }

  async listStock() {
    return prisma.estoque.findMany({ include: { produto: true } });
  }

  async listMovements() {
    return prisma.movimentacaoEstoque.findMany({ include: { produto: true, pedido: true } });
  }

  async listPurchases() {
    return prisma.compra.findMany({ include: { produto: true } });
  }
}

export default UploadStockReplenishmentUseCase;
