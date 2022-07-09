import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, concatMap, of, map, share, zip} from 'rxjs';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {WSMA} from '../WSMA/WSMA';

/**
 * Relative Strength Index (RSI)
 * Type: Momentum
 *
 * The Relative Strength Index (RSI) is an oscillator that ranges between 0 and 100. The RSI can be used to find trend
 * reversals, i.e. when a downtrend doesn't generate a RSI below 30 and rallies above 70 it could mean that a trend
 * reversal to the upside is taking place. Trend lines and moving averages should be used to validate such statements.
 *
 * The RSI is mostly useful in markets that alternate between bullish and bearish movements.
 *
 * A RSI value of 30 or below indicates an oversold condition (not a good time to sell because there is an oversupply).
 * A RSI value of 70 or above indicates an overbought condition (sell high opportunity because market may correct the
 * price in the near future).
 *
 * @see https://en.wikipedia.org/wiki/Relative_strength_index
 * @see https://www.investopedia.com/terms/r/rsi.asp
 */
export const RSI = (interval: number, SmoothingIndicator: MovingAverageTypes = WSMA) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let prevPrice: Big;
      let maxValue: Big = new Big(100);

      const source$ = observable.pipe(
        concatMap((price: BigSource, index: number) => {
          if (!index) {
            prevPrice = new Big(price);
            return of();
          }

          const currentPrice = new Big(price);
          const previousPrice = new Big(prevPrice);

          prevPrice = new Big(price);

          // Update average gain/loss
          if (currentPrice.gt(previousPrice)) {
            return of({
              avgLoss: new Big(0), // price went up, therefore no loss
              avgGain: currentPrice.minus(previousPrice),
            });
          } else {
            return of({
              avgLoss: previousPrice.minus(currentPrice),
              avgGain: new Big(0), // price went down, therefore no gain
            });
          }
        }),
        share()
      );
      const subscription = zip(
        source$.pipe(
          map(({avgLoss}) => avgLoss),
          SmoothingIndicator(interval)
        ),
        source$.pipe(
          map(({avgGain}) => avgGain),
          SmoothingIndicator(interval)
        )
      )
        .pipe(
          concatMap(([avgLoss, avgGain]) => {
            // Prevent division by zero: https://github.com/bennycode/trading-signals/issues/378
            if (new Big(avgLoss).eq(0)) {
              return of(new Big(100));
            }
            const relativeStrength = new Big(avgGain).div(avgLoss);
            return of(maxValue.minus(maxValue.div(relativeStrength.plus(1))));
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
        prevPrice = null!;
        maxValue = null!;
      };
    });
};
