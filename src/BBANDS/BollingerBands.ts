import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, concatMap, of, zip, map, bufferCount, filter, from, scan, last} from 'rxjs';

export type BandsResult = {
  lower: Big;
  middle: Big;
  upper: Big;
};

/**
 * Bollinger Bands (BBANDS)
 * Type: Volatility
 *
 * Bollinger Bands (BBANDS), developed by John A. Bollinger, are set as an envelope around a moving average. Narrow
 * bands indicate a sideways trend (ranging markets). To determine a breakout direction, [Investopia.com
 * suggests](https://www.investopedia.com/articles/technical/04/030304.asp) to use the relative strength index (RSI)
 * along with one or two volume-based indicators such as the intraday intensity index (developed by David Bostian) or
 * the accumulation/distribution index (developed by Larry William).
 *
 * When the upper and lower bands expand, there can be "M" and "W" formations. The "W" formation indicates a bullish
 * movement and the "M" formation indicates a bearish movement.
 *
 * @see https://www.investopedia.com/terms/b/bollingerbands.asp
 *
 * @param interval - The time period to be used in calculating the Middle Band
 * @param deviationMultiplier - The number of standard deviations away from the Middle Band that the Upper and Lower
 * Bands should be
 */
export const BollingerBands = (interval: number, deviationMultiplier: number = 2) => {
  return (observable: Observable<BigSource>) =>
    new Observable<BandsResult>((subscriber: Subscriber<BandsResult>) => {
      const subscription = observable
        .pipe(
          bufferCount(interval, 1),
          filter(items => items.length === interval),
          concatMap(items => {
            const middle = from(items).pipe(
              scan((curr, next) => curr.plus(next), new Big(0)),
              last(),
              map(x => x.div(items.length))
            );

            return zip(of(items), middle).pipe(
              concatMap(([items, middle]) => {
                const squaredDifferences = items.map((x: BigSource) => new Big(x).sub(middle).pow(2));

                return zip(
                  of(middle),
                  from(squaredDifferences).pipe(
                    scan((curr, next) => curr.plus(next), new Big(0)),
                    last(),
                    map(x => x.div(squaredDifferences.length || 1).sqrt())
                  )
                ).pipe(
                  concatMap(([middle, standardDeviation]) => {
                    return of({
                      lower: middle.sub(standardDeviation.times(deviationMultiplier)),
                      middle,
                      upper: middle.add(standardDeviation.times(deviationMultiplier)),
                    });
                  })
                );
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
      };
    });
};
