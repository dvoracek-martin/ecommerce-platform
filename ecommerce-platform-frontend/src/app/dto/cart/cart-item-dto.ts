import { CartItemType } from './cart-item-type';

export interface CartItemDTO {
  id: number;
  itemId: number;
  cartItemType: CartItemType;
  quantity: number;
}
