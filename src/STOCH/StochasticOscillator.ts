import Big from 'big.js';
import {from, Observable, concatMap, Subscriber, bufferCount, map, filter, zip, max, min, of, tap} from 'rxjs';
import {SMA} from '../SMA/SMA';
import {HighLowClose} from '../utils/HighLowClose';

export interface StochasticResult {
  /** Slow stochastic indicator (%D) */
  stochD: Big;
  /** Fast stochastic indicator (%K) */
  stochK: Big;
}

/**
 * Stochastic Oscillator (STOCH)
 * Type: Momentum
 *
 * The Stochastic Oscillator was developed by George Lane and is range-bound between 0 and 100. The Stochastic
 * Oscillator attempts to predict price turning points. A value of 80 indicates that the asset is on the verge of being
 * overbought. By default, a Simple Moving Average (SMA) is used. When the momentum starts to slow down, the Stochastic
 * Oscillator values start to turn down. In the case of an uptrend, prices tend to make higher highs, and the
 * settlement price usually tends to be in the upper end of that time period's trading range.
 *
 * The stochastic k (%k) values represent the relation between current close to the period's price range (high/low). It
 * is sometimes referred as the "fast" stochastic period (fastk). The stochastic d (%d) values represent a Moving
 * Average of the %k values. It is sometimes referred as the "slow" period.
 *
 * @see https://en.wikipedia.org/wiki/Stochastic_oscillator
 * @see https://www.investopedia.com/terms/s/stochasticoscillator.asp
 *
 * Constructs a Stochastic Oscillator.
 * @param n The %k period
 * @param m The %k slowing period
 * @param p The %d period
 */
export const StochasticOscillator = (n: number, m: number, p: number) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<StochasticResult>((subscriber: Subscriber<StochasticResult>) => {
      let stochK: Big = new Big(0);
      const subscription = observable
        .pipe(
          bufferCount(n, 1),
          filter(x => x.length === n),
          concatMap(candles => {
            const candle = candles[candles.length - 1];
            return zip(
              from(candles).pipe(
                map(({high}) => new Big(high)),
                max((a, b) => (a.lt(b) ? -1 : 1))
              ),
              from(candles).pipe(
                map(({low}) => new Big(low)),
                min((a, b) => (a.lt(b) ? -1 : 1))
              )
            ).pipe(
              concatMap(([highest, lowest]) => {
                const divisor = new Big(highest).minus(lowest);
                let fastK = new Big(100).times(new Big(candle.close).minus(lowest));
                // Prevent division by zero
                fastK = fastK.div(divisor.eq(0) ? 1 : divisor);

                return of(fastK);
              })
            );
          }),
          SMA(m),
          tap(x => (stochK = x)),
          SMA(p),
          map(stochD => ({stochD, stochK}))
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
