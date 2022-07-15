import Big, {BigSource} from 'big.js';
import {map, Observable, Subscriber} from 'rxjs';

/// 1: 上穿upper 2: 上穿之后回落跌破upper 3: 上穿lower 4: 跌破lower
export type BuySellResult = 1 | 2 | 3 | 4;

export const tradeRx = (upper: number, lower: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BuySellResult>((subscriber: Subscriber<BuySellResult>) => {
      let prev = 0;

      const subscription = observable.pipe(map(x => new Big(x))).subscribe({
        next(r) {
          if (r.gt(upper)) {
            if (prev !== 1) {
              subscriber.next(1);
            }
            prev = 1;
          } else if (r.gt(lower)) {
            if (prev === 1) {
              subscriber.next(2);
            } else if (prev === 3) {
              subscriber.next(3);
            }
            prev = 2;
          } else {
            if (prev !== 3) {
              subscriber.next(4);
            }
            prev = 3;
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
