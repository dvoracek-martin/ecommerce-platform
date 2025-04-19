export interface UpdateCategoryDTO {
  id: number;
  name: string;
  description?: string;
  categoryType: string;
  uploadMediaDTOs?: {
    base64Data: string;
    objectKey: string;
    contentType: string;
  }[];
}
