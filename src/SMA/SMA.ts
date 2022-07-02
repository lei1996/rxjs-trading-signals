import Big, {BigSource} from 'big.js';
import {from, Observable, concatMap, Subscriber, bufferCount, scan, map, last, filter} from 'rxjs';

export const SMA = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      const subscription = observable
        .pipe(
          bufferCount(interval, 1),
          filter(items => items.length === interval),
          concatMap(items => {
            return from(items).pipe(
              scan((curr, next) => curr.plus(next), new Big(0)),
              last(),
              map(x => x.div(interval))
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
