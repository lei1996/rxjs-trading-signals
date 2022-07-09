import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, concatMap, bufferCount, filter, share, zip, from, scan, last, map} from 'rxjs';
import {SMA} from '../SMA/SMA';

/**
 * Mean Absolute Deviation (MAD)
 * Type: Volatility
 *
 * The mean absolute deviation (MAD) is calculating the absolute deviation / difference from the mean over a period.
 * Large outliers will reflect in a higher MAD.
 *
 * @see https://en.wikipedia.org/wiki/Average_absolute_deviation
 */
export const MAD = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      const source$ = observable.pipe(share());

      const subscription = zip(
        source$.pipe(SMA(interval)),
        source$.pipe(
          bufferCount(interval, 1),
          filter(x => x.length === interval)
        )
      )
        .pipe(
          concatMap(([mean, prices]) => {
            return from(prices).pipe(
              scan((curr, next) => curr.plus(new Big(next).minus(mean).abs()), new Big(0)),
              last(),
              map(x => x.div(prices.length || 1))
            );
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
