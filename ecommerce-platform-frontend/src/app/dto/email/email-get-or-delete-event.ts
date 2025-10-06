import {EmailObjectsEnum} from './email-objects-enum';

export interface EmailGetOrDeleteEvent {
  objectType: EmailObjectsEnum;
  entityId?: number;
}
