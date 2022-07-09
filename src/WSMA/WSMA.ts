import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, filter, tap, of} from 'rxjs';
import {SMA} from '../SMA/SMA';
import {isZero} from '../utils/isZero';

export const WSMA = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let result: Big = new Big(0);
      let curr: BigSource = new Big(0);
      const smoothingFactor = new Big(1).div(interval);

      const subscription = observable
        .pipe(
          tap(price => (curr = price)),
          SMA(interval),
          concatMap(sma => {
            if (!isZero(result)) {
              const smoothed = new Big(curr).minus(result).times(smoothingFactor);
              result = smoothed.plus(result);
            } else if (isZero(result) && sma) {
              result = new Big(sma);
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
        result = null!;
        curr = null!;
      };
    });
};
