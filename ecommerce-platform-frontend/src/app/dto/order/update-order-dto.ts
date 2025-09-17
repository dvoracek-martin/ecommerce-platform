import { CartItemDTO } from '../cart/cart-item-dto';
import { OrderStatus } from './order-status';

export interface UpdateOrderDTO {
  id?: number;
  customerId?: string;
  items?: CartItemDTO[];
  shippingCost?: number;
  cartTotal?: number;
  finalTotal?: number;
  status?: OrderStatus;
  shippingMethod?: string;
  paymentMethod?: string;
  orderDate?: string;
  trackingNumber?: string;
  orderYearOrderCounter?: number;
}
