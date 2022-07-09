import Big, {BigSource} from 'big.js';
import {Observable, concatMap, Subscriber, of, share, zip, skip} from 'rxjs';
import {SMA} from '../SMA/SMA';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';

export type DMAResult = {long: Big; short: Big};

/**
 * Dual Moving Average (DMA)
 * Type: Trend
 *
 * The DMA consists of two moving averages: Short-term & long-term.
 *
 * Dual Moving Average Crossover:
 * A short-term MA crossing above a long-term MA indicates a bullish buying opportunity.
 * A short-term MA crossing below a long-term MA indicates a bearish selling opportunity.
 *
 * @see https://faculty.fuqua.duke.edu/~charvey/Teaching/BA453_2002/CCAM/CCAM.htm#_Toc2634228
 */
export const DMA = (short: number, long: number, Indicator: MovingAverageTypes = SMA) => {
  return (observable: Observable<BigSource>) =>
    new Observable<DMAResult>((subscriber: Subscriber<DMAResult>) => {
      if (short > long) {
        [short, long] = [long, short];
      }

      const source$ = observable.pipe(share());

      const subscription = zip(
        source$.pipe(
          Indicator(short),
          skip(long - short) // long > short
        ),
        source$.pipe(Indicator(long))
      )
        .pipe(
          concatMap(([short, long]) => {
            return of({
              long: new Big(long),
              short: new Big(short),
            });
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
      };
    });
};
