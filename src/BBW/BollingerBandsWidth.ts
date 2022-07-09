import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, map} from 'rxjs';
import {BollingerBands} from '../BBANDS/BollingerBands';

/**
 * The Bollinger Bands Width (BBW) indicator, developed by John A. Bollinger, merges the information of Bollinger Bands
 * into one definite number. It defines the narrowness of the underlying Bollinger Bands by representing the difference
 * between the Upper Band and the Lower Band.
 *
 * @see https://www.tradingview.com/support/solutions/43000501972-bollinger-bands-width-bbw/
 */
export const BollingerBandsWidth = (interval: number, deviationMultiplier: number = 2) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      const subscription = observable
        .pipe(
          BollingerBands(interval, deviationMultiplier),
          map(({upper, middle, lower}) => upper.minus(lower).div(middle))
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
