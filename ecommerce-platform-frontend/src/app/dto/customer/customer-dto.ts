import {CustomerBillingAddressDTO} from './custommer-billing-address-dto';
import {CustomerAddressDTO} from './customer-address-dto';

export class CustomerDTO {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address?: CustomerAddressDTO | null;
  billingAddress?: CustomerBillingAddressDTO | null;
}
