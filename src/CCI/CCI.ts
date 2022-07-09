import Big from 'big.js';
import {Observable, Subscriber, map, concatMap, of, share, zip, bufferCount, from, scan, last} from 'rxjs';
import {SMA} from '../SMA/SMA';
import {HighLowClose} from '../utils/HighLowClose';

export const CCI = (interval: number) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      const source$ = observable.pipe(
        concatMap(({high, low, close}) => {
          return of(new Big(high).plus(low).plus(close).div(3));
        }),
        share()
      );

      const subscription = zip(source$.pipe(SMA(interval)), source$.pipe(bufferCount(interval, 1)))
        .pipe(
          concatMap(([mean, typicalPrices]) => {
            return zip(
              of(typicalPrices[typicalPrices.length - 1].minus(mean)),
              from(typicalPrices).pipe(
                scan((curr, next) => curr.plus(next.minus(mean).abs()), new Big(0)),
                last(),
                map(x => x.div(interval))
              )
            ).pipe(map(([numerator, meanDeviation]) => numerator.div(new Big(0.015).mul(meanDeviation))));
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
