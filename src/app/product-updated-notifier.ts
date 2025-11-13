// DTO for product update notification event
export type ProductUpdatedDto = {
  id: string;
  name: string;
  pricePence: number;
  description: string;
  updatedAt: string; // ISO string format
};

export interface ProductUpdatedNotifier {
  notifyProductUpdated(product: ProductUpdatedDto): Promise<void>;
}
