import prisma from '../../infrastructure/prisma/client';

interface OrderItemInput {
  sku: string;
  quantidade: number;
  productName: string;
  itemPrice: number;
}

interface OrderInput {
  orderId: string;
  valorTotal: number;
  clienteEmail: string;
  clienteNome: string;
  cpf: string;
  data: Date;
  items: OrderItemInput[];
}

export default class OrderProcessingService {
  constructor(private prismaClient = prisma) {}

  public async processOrders(orders: OrderInput[]) {
    const prioritized = [...orders].sort((a, b) => b.valorTotal - a.valorTotal);

    for (const order of prioritized) {
      const client = await this.findOrCreateCliente(order);
      const pedido = await this.createPedido(order, client.id);
      let hasFullStock = true;

      for (const item of order.items) {
        const product = await this.findOrCreateProduto(item);
        const stock = await this.prismaClient.estoque.findUnique({ where: { produtoId: product.id } });
        const available = stock?.quantidade ?? 0;

        if (available < item.quantidade) {
          hasFullStock = false;
          await this.createCompra(product.id, item.quantidade - available);
        }
      }

      if (hasFullStock) {
        await this.reserveStockAndRegisterMovements(pedido.id, order.items);
        await this.prismaClient.pedido.update({ where: { id: pedido.id }, data: { status: 'Atendido' } });
      } else {
        await this.prismaClient.pedido.update({ where: { id: pedido.id }, data: { status: 'Aguardando Estoque' } });
      }
    }
  }

  private async findOrCreateCliente(order: OrderInput) {
    return this.prismaClient.cliente.upsert({
      where: { cpf: order.cpf },
      create: {
        cpf: order.cpf,
        nome: order.clienteNome,
        email: order.clienteEmail,
        telefone: 'N/A',
      },
      update: {
        nome: order.clienteNome,
        email: order.clienteEmail,
      },
    });
  }

  private async createPedido(order: OrderInput, clienteId: number) {
    return this.prismaClient.pedido.create({
      data: {
        orderId: order.orderId,
        clienteId,
        data: order.data,
        valorTotal: order.valorTotal,
        status: 'Pendente',
      },
    });
  }

  private async findOrCreateProduto(item: OrderItemInput) {
    return this.prismaClient.produto.upsert({
      where: { sku: item.sku },
      create: {
        sku: item.sku,
        nome: item.productName,
        preco: item.itemPrice,
      },
      update: {
        nome: item.productName,
        preco: item.itemPrice,
      },
    });
  }

  private async reserveStockAndRegisterMovements(pedidoId: number, items: OrderItemInput[]) {
    for (const item of items) {
      const product = await this.prismaClient.produto.findUnique({ where: { sku: item.sku } });
      if (!product) {
        continue;
      }

      await this.prismaClient.estoque.upsert({
        where: { produtoId: product.id },
        create: { produtoId: product.id, quantidade: 0 },
        update: { quantidade: { decrement: item.quantidade } },
      });

      await this.prismaClient.movimentacaoEstoque.create({
        data: {
          produtoId: product.id,
          pedidoId,
          quantidade: item.quantidade,
        },
      });

      await this.prismaClient.itemPedido.create({
        data: {
          pedidoId,
          produtoId: product.id,
          quantidade: item.quantidade,
          precoUnit: item.itemPrice,
        },
      });
    }
  }

  private async createCompra(produtoId: number, quantidade: number) {
    return this.prismaClient.compra.create({
      data: {
        produtoId,
        quantidade,
        status: 'Pendente',
      },
    });
  }
}
