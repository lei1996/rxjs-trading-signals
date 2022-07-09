import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, of, share, zip, map, skip} from 'rxjs';
import {DEMA} from '../DEMA/DEMA';
import {EMA} from '../EMA/EMA';

export type MACDConfig = {
  indicator: typeof EMA | typeof DEMA;
  longInterval: number;
  shortInterval: number;
  signalInterval: number;
};

export type MACDResult = {
  histogram: Big;
  macd: Big;
  signal: Big;
};

/**
 * Moving Average Convergence Divergence (MACD)
 * Type: Momentum
 *
 * The MACD triggers trading signals when it crosses above (bullish buying opportunity) or below (bearish selling
 * opportunity) its signal line. MACD can be used together with the RSI to provide a more accurate trading signal.
 *
 * @see https://www.investopedia.com/terms/m/macd.asp
 */
export const MACD = (config: MACDConfig) => {
  return (observable: Observable<BigSource>) =>
    new Observable<MACDResult>((subscriber: Subscriber<MACDResult>) => {
      let {indicator, shortInterval, longInterval} = config;
      const {signalInterval} = config;
      let macd: Big = new Big(0);

      if (shortInterval > longInterval) {
        [shortInterval, longInterval] = [longInterval, shortInterval];
      }

      const source$ = observable.pipe(share());

      const subscription = zip(
        source$.pipe(
          indicator(shortInterval),
          skip(longInterval - shortInterval) // long > short
        ),
        source$.pipe(indicator(longInterval))
      )
        .pipe(
          concatMap(([short, long]) => {
            const x = new Big(short).minus(long);
            macd = x;

            return of(x);
          }),
          indicator(signalInterval, true),
          map(signal => ({
            histogram: macd.minus(signal),
            macd: macd,
            signal: new Big(signal),
          }))
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
        indicator = null!;
        macd = null!;
      };
    });
};
