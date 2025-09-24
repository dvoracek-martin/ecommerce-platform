import {CustomerBillingAddress} from './custommer-billing-address-dto';
import {CustomerAddress} from './customer-address-dto';

export class Customer {
  id?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  address?: CustomerAddress | null;
  billingAddress?: CustomerBillingAddress | null;
  preferredLanguageId: number;
  active: boolean;
}
