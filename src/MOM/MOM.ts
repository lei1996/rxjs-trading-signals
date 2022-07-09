import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, bufferCount, filter, map, tap} from 'rxjs';

/**
 * Momentum Indicator (MOM / MTM)
 * Type: Momentum
 *
 * The Momentum indicator returns the change between the current price and the price n times ago.
 *
 * @see https://en.wikipedia.org/wiki/Momentum_(technical_analysis)
 * @see https://www.warriortrading.com/momentum-indicator/
 */
export const MOM = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let price = new Big(0);

      const subscription = observable
        .pipe(
          tap(x => (price = new Big(x))),
          bufferCount(interval + 1, 1),
          filter(x => x.length === interval + 1),
          map(([first]) => price.minus(first))
        )
        .subscribe({
          next(x) {
            subscriber.next(x);
          },
          error(err) {
            // We need to make sure we're propagating our errors through.
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });

      return () => {
        subscription.unsubscribe();
        // Clean up all state.
        price = null!;
      };
    });
};
