import {ResponseProductDTO} from '../product/response-product-dto';
import {ResponseCategoryDTO} from '../category/response-category-dto';
import {ResponseMixtureDTO} from '../mixtures/response-mixture-dto';

export interface ResponseTagDTO {
  id: number;
  name: string;
  priority: number;
  active: boolean;
  products: ResponseProductDTO[];
  categories: ResponseCategoryDTO[];
  mixtures: ResponseMixtureDTO[];
}
