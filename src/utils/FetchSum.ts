import Big, {BigSource} from 'big.js';
import {map, Observable, Subscriber, pipe, scan, toArray} from 'rxjs';

export type Direction = 'buy' | 'sell';
export type Offset = 'open' | 'close';

export const fetchSum = () => {
  return pipe(
    scan((curr, next: BigSource) => curr.plus(next), new Big(0)),
    map(x => x.round(8).toNumber()),
    toArray()
  );
};

export type FetchProfitType = {
  offset: Offset;
  price: BigSource;
};

export const FetchProfit = (direction: Direction) => {
  return (observable: Observable<FetchProfitType>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let prev = new Big(0);

      const subscription = observable.subscribe({
        next(x) {
          if (x.offset === 'open') {
            prev = new Big(x.price);
          } else if (x.offset === 'close' && !prev.eq(0)) {
            const profit = direction === 'buy' ? new Big(x.price).minus(prev) : prev.minus(x.price);

            subscriber.next(profit);
          }
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
        prev = null!;
      };
    });
};
