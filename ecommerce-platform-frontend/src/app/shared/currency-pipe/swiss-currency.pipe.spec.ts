import { SwissCurrencyPipe } from './swiss-currency.pipe';

describe('SwissCurrencyPipe', () => {
  it('create an instance', () => {
    const pipe = new SwissCurrencyPipe();
    expect(pipe).toBeTruthy();
  });
});
