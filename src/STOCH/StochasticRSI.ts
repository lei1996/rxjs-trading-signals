import Big, {BigSource} from 'big.js';
import {from, Observable, concatMap, Subscriber, bufferCount, filter, zip, max, min, of, tap} from 'rxjs';
import {RSI} from '../RSI/RSI';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {WSMA} from '../WSMA/WSMA';

/**
 * Stochastic RSI (STOCHRSI)
 * Type: Momentum
 *
 * The Stochastic RSI is an oscillator ranging from 0 to 1 and was developed by Tushar S. Chande and Stanley Kroll.
 * Compared to the RSI, the Stochastic RSI is much steeper and often resides at the extremes (0 or 1). It can be used
 * to identify short-term trends.
 *
 * - A return value of 0.2 or below indicates an oversold condition
 * - A return value of 0.8 or above indicates an overbought condition
 * - Overbought doesn't mean that the price will reverse lower but it shows that the RSI reached an extreme
 * - Oversold doesn't mean that the price will reverse higher but it shows that the RSI reached an extreme
 *
 * @see https://www.investopedia.com/terms/s/stochrsi.asp
 */
export const StochasticRSI = (interval: number, SmoothingIndicator: MovingAverageTypes = WSMA) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let rsiResult: Big = new Big(0);
      const subscription = observable
        .pipe(
          RSI(interval, SmoothingIndicator),
          tap(x => (rsiResult = x)),
          bufferCount(interval, 1),
          filter(x => x.length === interval),
          concatMap(periods => {
            return zip(
              from(periods).pipe(max((a, b) => (a.lt(b) ? -1 : 1))),
              from(periods).pipe(min((a, b) => (a.lt(b) ? -1 : 1)))
            ).pipe(
              concatMap(([max, min]) => {
                const denominator = max.minus(min);
                // Prevent division by zero: https://github.com/bennycode/trading-signals/issues/378
                if (denominator.eq(0)) {
                  return of(new Big(100));
                }
                const numerator = rsiResult.minus(min);
                return of(numerator.div(denominator));
              })
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
        rsiResult = null!;
      };
    });
};
