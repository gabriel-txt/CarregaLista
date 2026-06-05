import { parse } from 'csv-parse/sync';
import prisma from '../../infrastructure/prisma/client';
import { MarketplaceCsvRowSchema, MarketplaceCsvRow } from '../dto/validation/marketplaceCsvSchemas';

interface StagingRecord {
  order_id: string;
  order_item_id: string;
  purchase_date: Date;
  payments_date: Date;
  buyer_email: string;
  buyer_name: string;
  cpf: string;
  buyer_phone: string;
  sku: string;
  product_name: string;
  quantity: number;
  currency: string;
  item_price: number;
  ship_service_level: string;
  ship_address1: string;
  ship_city: string;
  ship_state: string;
  ship_postal_code: string;
  ship_country: string;
}

class UploadOrdersUseCase {
  async execute(csv: string) {
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as unknown[];

    const stagingRecords = records.map((row) => {
      const parsed = MarketplaceCsvRowSchema.parse(row as object);
      return {
        orderId: parsed['order-id'],
        orderItemId: parsed['order-item-id'],
        purchaseDate: new Date(parsed['purchase-date']),
        paymentsDate: new Date(parsed['payments-date']),
        buyerEmail: parsed['buyer-email'],
        buyerName: parsed['buyer-name'],
        cpf: parsed.cpf,
        buyerPhone: parsed['buyer-phone-number'],
        sku: parsed.sku,
        productName: parsed['product-name'],
        quantity: parsed['quantity-purchased'],
        currency: parsed.currency,
        itemPrice: parsed['item-price'],
        shipServiceLevel: parsed['ship-service-level'],
        shipAddress1: parsed['ship-address-1'],
        shipCity: parsed['ship-city'],
        shipState: parsed['ship-state'],
        shipPostalCode: parsed['ship-postal-code'],
        shipCountry: parsed['ship-country'],
      };
    });

    const batch = await prisma.stagingPedido.createMany({
      data: stagingRecords,
      skipDuplicates: true,
    });

    return batch.count;
  }

  async listOrders() {
    return prisma.pedido.findMany({
      include: {
        cliente: true,
        itens: true,
      },
    });
  }

  async getOrderById(id: number) {
    return prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: true,
      },
    });
  }
}

export default UploadOrdersUseCase;
