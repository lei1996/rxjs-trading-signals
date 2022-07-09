import Big from 'big.js';
import {Observable, Subscriber, concatMap, of, share, zip, map, skip} from 'rxjs';
import {HighLow} from '../utils/HighLowClose';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {SMA} from '../SMA/SMA';

/**
 * Awesome Oscillator (AO)
 * Type: Momentum
 *
 * The Awesome Oscillator (AO) is an indicator used to measure market momentum.
 * It has been developed by the technical analyst and charting enthusiast Bill Williams.
 *
 * When AO crosses above Zero, short term momentum is rising faster than long term momentum which signals a bullish
 * buying opportunity. When AO crosses below Zero, short term momentum is falling faster then the long term momentum
 * which signals a bearish selling opportunity.
 *
 * @see https://www.tradingview.com/support/solutions/43000501826-awesome-oscillator-ao/
 * @see https://tradingstrategyguides.com/bill-williams-awesome-oscillator-strategy/
 */
export const AO = (shortInterval: number, longInterval: number, SmoothingIndicator: MovingAverageTypes = SMA) => {
  return (observable: Observable<HighLow>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      const source$ = observable.pipe(
        concatMap(({high, low}) => {
          const candleSum = new Big(low).add(high);
          const medianPrice = candleSum.div(2);

          return of(medianPrice);
        }),
        share()
      );

      const subscription = zip(
        source$.pipe(SmoothingIndicator(shortInterval), skip(longInterval - shortInterval)),
        source$.pipe(SmoothingIndicator(longInterval))
      )
        .pipe(map(([short, long]) => new Big(short).minus(long)))
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
