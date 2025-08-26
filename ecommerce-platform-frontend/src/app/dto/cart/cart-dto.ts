import { CartItemDTO } from './cart-item-dto';

export interface CartDTO {
  id: number;
  username: string;
  items: CartItemDTO[];
  totalPrice: number;
}
