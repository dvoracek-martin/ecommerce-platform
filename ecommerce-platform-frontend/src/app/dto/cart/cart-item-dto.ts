import { CartItemType } from './cart-item-type';

export interface CartItemDTO {
  id: number;
  itemId: number;
  itemType: CartItemType;
  quantity: number;
}
