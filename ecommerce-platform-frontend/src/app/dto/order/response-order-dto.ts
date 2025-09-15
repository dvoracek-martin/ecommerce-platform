import {OrderItemResponse} from './order-item-response';

export interface ResponseOrderDTO {
  id: number;
  username: string | null;
  guestId: string | null;
  items: OrderItemResponse[];
  discount: number | null;
}
