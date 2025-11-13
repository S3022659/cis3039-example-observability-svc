export type Product = {
  id: string;
  name: string;
  pricePence: number;
  description: string;
  updatedAt: Date;
};

export type CreateProductParams = {
  id: string;
  name: string;
  pricePence: number;
  description: string;
  updatedAt: Date;
};

export class ProductError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ProductError';
  }
}

const validateProduct = (params: CreateProductParams): void => {
  if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
    throw new ProductError('id', 'Product id must be a non-empty string.');
  }
  if (
    !params.name ||
    typeof params.name !== 'string' ||
    params.name.trim() === ''
  ) {
    throw new ProductError('name', 'Product name must be a non-empty string.');
  }
  if (
    typeof params.pricePence !== 'number' ||
    params.pricePence < 0 ||
    !Number.isInteger(params.pricePence)
  ) {
    throw new ProductError(
      'pricePence',
      'Product pricePence must be a non-negative integer.'
    );
  }
  if (
    !params.description ||
    typeof params.description !== 'string' ||
    params.description.trim() === ''
  ) {
    throw new ProductError(
      'description',
      'Product description must be a non-empty string.'
    );
  }
  if (
    !(params.updatedAt instanceof Date) ||
    isNaN(params.updatedAt.getTime())
  ) {
    throw new ProductError(
      'updatedAt',
      'updatedAt must be a valid Date object.'
    );
  }
};

export const createProduct = (params: CreateProductParams): Product => {
  validateProduct(params);

  return {
    id: params.id,
    name: params.name,
    pricePence: params.pricePence,
    description: params.description,
    updatedAt: params.updatedAt,
  };
};
