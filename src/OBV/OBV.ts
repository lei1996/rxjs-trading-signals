import Big from 'big.js';
import {Observable, Subscriber, filter, concatMap, of} from 'rxjs';
import {OpenHighLowCloseVolume} from '../utils/HighLowClose';

/**
 * On-Balance Volume (OBV)
 * Type: Momentum
 *
 * On-balance volume (OBV) is a technical trading momentum indicator that uses volume flow to predict changes in stock
 * price. Joseph Granville first developed the OBV metric in the 1963 book Granville's New Key to Stock Market Profits.
 *
 * @see https://www.investopedia.com/terms/o/onbalancevolume.asp
 */
export const OBV = () => {
  return (observable: Observable<OpenHighLowCloseVolume>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let prevCandle: OpenHighLowCloseVolume;
      let result: Big = new Big(0);

      const subscription = observable
        .pipe(
          concatMap(candle => {
            if (!prevCandle) {
              prevCandle = candle;
              return of(result);
            } else {
              const prevPrice = prevCandle.close;
              const prevResult = result;
              const currentPrice = new Big(candle.close);
              const nextResult = currentPrice.gt(prevPrice)
                ? candle.volume
                : currentPrice.lt(prevPrice)
                ? -candle.volume
                : 0;

              prevCandle = candle;

              result = prevResult.add(nextResult);

              return of(result);
            }
          }),
          filter(x => !x.eq(0))
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
        prevCandle = null!;
        result = null!;
      };
    });
};
