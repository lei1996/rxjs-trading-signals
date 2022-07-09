import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, concatMap, of, range, last, map, share, zip, skip} from 'rxjs';
import {SMA} from '../SMA/SMA';

export type CGResult = {
  cg: Big;
  signal: Big;
};

/**
 * Center of Gravity (CG)
 * Type: Trend
 *
 * Implementation of the Center of Gravity (CG) oscillator by John Ehlers.
 *
 * @note According to the specification, the price inputs shall be calculated the following way:
 * ((High Price + Low Price) / 2)
 * @note The selected interval should be half the dominant cycle length (signal line)
 * @note If the interval gets too short, the CG oscillator loses its smoothing and gets a little too nervous for
 *   profitable trading
 * @see http://www.mesasoftware.com/papers/TheCGOscillator.pdf
 */
export const CG = (interval: number, signalInterval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<CGResult>((subscriber: Subscriber<CGResult>) => {
      let prices: Big[] = [];

      const source$ = observable.pipe(
        concatMap((price: BigSource) => {
          prices.push(new Big(price));

          if (prices.length > interval) {
            prices.shift();
          }

          let nominator = new Big(0);
          let denominator = new Big(0);

          return range(0, prices.length).pipe(
            concatMap(i => {
              const price = new Big(prices[i]);
              nominator = nominator.plus(price.times(i + 1));
              denominator = denominator.plus(price);

              return of({
                nominator,
                denominator,
              });
            }),
            last(),
            map(({nominator, denominator}) => (denominator.gt(0) ? nominator.div(denominator) : new Big(0)))
          );
        }),
        share()
      );

      const subscription = zip(source$.pipe(skip(signalInterval)), source$.pipe(SMA(signalInterval)))
        .pipe(concatMap(([cg, signal]) => of({cg, signal})))
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
        prices = null!;
      };
    });
};
