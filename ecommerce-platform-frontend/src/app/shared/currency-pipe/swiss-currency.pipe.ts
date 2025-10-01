import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'swissCurrency' })
export class SwissCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    if (value % 1 === 0) {
      return `${value}.-`;
    } else {
      return value.toFixed(1);
    }
  }
}
