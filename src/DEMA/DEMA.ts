import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, of, tap} from 'rxjs';
import {EMA} from '../EMA/EMA';

/**
 * Double Exponential Moving Average (DEMA)
 * Type: Trend
 *
 * The Double Exponential Moving Average (DEMA) was developed by Patrick G. Mulloy. It attempts to remove the lag
 * associated with Moving Averages by placing more weight on recent values. It has its name because the value of an EMA
 * is doubled which makes it responds more quickly to short-term price changes than a normal EMA.
 *
 * @see https://www.investopedia.com/terms/d/double-exponential-moving-average.asp
 */
export const DEMA = (interval: number, isOutput: boolean = false) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      let innerResult: BigSource = new Big(0);

      const subscription = observable
        .pipe(
          EMA(interval, true),
          tap(x => (innerResult = x)),
          EMA(interval, isOutput),
          concatMap(outerResult => {
            return of(new Big(innerResult).times(2).minus(outerResult));
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
        innerResult = null!;
      };
    });
};
