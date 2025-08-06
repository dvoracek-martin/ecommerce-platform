import {ResponseProductDTO} from '../product/response-product-dto';
import {ResponseCategoryDTO} from '../category/response-category-dto';
import {ResponseTagDTO} from '../tag/response-tag-dto';
import {ResponseMixtureDTO} from '../mixtures/response-mixture-dto';

export interface SearchResultDTO {
  products: ResponseProductDTO[];
  categories: ResponseCategoryDTO[];
  mixtures: ResponseMixtureDTO[];
  tags: ResponseTagDTO[];
}
