import {OrderStatus} from './order-status';
import {CartItemDTO} from '../cart/cart-item-dto';


export interface ResponseOrderDTO {
  id: number;
  customerId: string;
  items: CartItemDTO[];
  shippingCost: number;
  cartTotal: number;
  finalTotal: number;
  status: OrderStatus;
  shippingMethod: string;
  paymentMethod: string;
  orderDate: string;
  trackingNumber?: string;
  orderYearOrderCounter: number;
  selectedLocale: string;
}
