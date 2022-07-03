import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, filter, of} from 'rxjs';
import {isZero} from '../utils/isZero';

export const EMA = (interval: number, isOutput: boolean = false) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      let result: BigSource = new Big(0);
      let weightFactor: number = 2 / (interval + 1);
      let count: number = 0;

      const subscription = observable
        .pipe(
          concatMap(_price => {
            count++;
            const price = new Big(_price);

            if (isZero(result)) {
              result = price;
            }

            const w = new Big(result).times(1 - weightFactor);

            result = price.times(weightFactor).add(w);

            return of(result).pipe(filter(() => isOutput || count >= interval));
          })
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
        result = null!;
        weightFactor = null!;
        count = null!;
      };
    });
};
