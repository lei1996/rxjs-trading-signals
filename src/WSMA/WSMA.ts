import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, filter, tap, of} from 'rxjs';
import {SMA} from '../SMA/SMA';

export const WSMA = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      let result: BigSource = new Big(0);
      let curr: BigSource = new Big(0);
      const smoothingFactor = new Big(1).div(interval);

      const isZero = (x: BigSource) => new Big(x).eq(0);

      const subscription = observable
        .pipe(
          tap(price => (curr = price)),
          SMA(interval),
          concatMap(sma => {
            if (!isZero(result)) {
              const smoothed = new Big(curr).minus(result).times(smoothingFactor);
              result = smoothed.plus(result);
            } else if (isZero(result) && sma) {
              result = sma;
            }

            return of(result).pipe(filter(x => !isZero(x)));
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
      };
    });
};
