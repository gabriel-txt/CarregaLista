import { z } from 'zod';

export const MarketplaceCsvRowSchema = z.object({
  'order-id': z.string().min(1),
  'order-item-id': z.string().min(1),
  'purchase-date': z.string().min(1),
  'payments-date': z.string().min(1),
  'buyer-email': z.string().email(),
  'buyer-name': z.string().min(1),
  cpf: z.string().min(11),
  'buyer-phone-number': z.string().min(1),
  sku: z.string().min(1),
  'product-name': z.string().min(1),
  'quantity-purchased': z.string().transform((val) => parseInt(val, 10)),
  currency: z.string().max(3),
  'item-price': z.string().transform((val) => parseFloat(val.replace(',', '.'))),
  'ship-service-level': z.string(),
  'ship-address-1': z.string(),
  'ship-city': z.string(),
  'ship-state': z.string(),
  'ship-postal-code': z.string(),
  'ship-country': z.string(),
});

export type MarketplaceCsvRow = z.infer<typeof MarketplaceCsvRowSchema>;
