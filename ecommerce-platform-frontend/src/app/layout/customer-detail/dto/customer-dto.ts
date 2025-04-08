import {CustomerBillingAddressDTO} from './custommer-billing-address-dto';
import {CustomerAddressDTO} from './customer-address-dto';

export class CustomerDTO {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address?: CustomerAddressDTO | null;
  billingAddress?: CustomerBillingAddressDTO | null;
}
