
export interface SearchResultDTO {
  id: string;

  name: string;

  type: 'products' | 'mixtures';

  tags?: string[];
}
