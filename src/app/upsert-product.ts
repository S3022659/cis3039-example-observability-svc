import {
  ProductUpdatedNotifier,
  ProductUpdatedDto,
} from './product-updated-notifier';
import { Product, createProduct, CreateProductParams } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';
import { Logger } from './logger';

export type UpsertProductDeps = {
  productRepo: ProductRepo;
  now: () => Date;
  productUpdatedNotifier: ProductUpdatedNotifier;
  logger: Logger;
};

export type UpsertProductCommand = {
  id: string;
  name: string;
  pricePence: number;
  description: string;
};

export type UpsertProductResult = {
  success: boolean;
  data?: Product;
  error?: string;
};

/**
 * Create a use-case for upserting a product.
 * This will create a new product or update an existing one.
 * Usage:
 *   const result = await upsertProduct({ productRepo, now: () => new Date() }, productData);
 */
export async function upsertProduct(
  deps: UpsertProductDeps,
  command: UpsertProductCommand
): Promise<UpsertProductResult> {
  const { productRepo, now } = deps;

  try {
    // Validate and create the product entity
    const product = createProduct({
      ...command,
      updatedAt: now(),
    });

    deps.logger.info(
      `Upserting product with id: ${
        product.id
      } at ${product.updatedAt.toISOString()}`
    );

    // Save (upsert) the product
    const savedProduct = await productRepo.save(product);

    deps.logger.info(`Product upserted with id: ${savedProduct.id}`);
    deps.logger.debug(
      `Upserted product details: ${JSON.stringify(savedProduct)}`
    );
    deps.logger.info(`Notifying product updated for id: ${savedProduct.id}`);

    // Notify about the product update
    const dto: ProductUpdatedDto = {
      id: savedProduct.id,
      name: savedProduct.name,
      pricePence: savedProduct.pricePence,
      description: savedProduct.description,
      updatedAt: savedProduct.updatedAt.toISOString(),
    };
    await deps.productUpdatedNotifier.notifyProductUpdated(dto);

    deps.logger.info(
      `Product updated notification sent for id: ${savedProduct.id}`
    );

    return { success: true, data: savedProduct };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
