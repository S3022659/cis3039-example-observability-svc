import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export type ListProductsDeps = {
  productRepo: ProductRepo;
};

export type ListProductsResult = {
  success: boolean;
  data?: Product[];
  error?: string;
};

/**
 * Create a use-case for listing products.
 * Usage:
 *   const result = await listProducts({ productRepo });
 */
export async function listProducts(
  deps: ListProductsDeps
): Promise<ListProductsResult> {
  const { productRepo } = deps;

  try {
    const products = await productRepo.list();
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
