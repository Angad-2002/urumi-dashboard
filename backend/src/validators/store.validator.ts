import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(200).trim(),
  engine: z.enum(['woocommerce', 'medusa'], {
    required_error: 'Store engine is required',
    invalid_type_error: 'Store engine must be "woocommerce" or "medusa"'
  })
});

export type CreateStoreRequest = z.infer<typeof createStoreSchema>;
