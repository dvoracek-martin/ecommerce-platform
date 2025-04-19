export interface ResponseMediaDTO { // Renamed to singular and consistent casing
  /** Base64-encoded file data */
  base64Data: string;
  /** Key/path where the file will be stored */
  objectKey: string;
  /** MIME type of the file */
  contentType: string;
}
