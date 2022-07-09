import Big from 'big.js';
import {Observable, Subscriber, concatMap, of, share, zip, map} from 'rxjs';
import {HighLowClose} from '../utils/HighLowClose';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {SMA} from '../SMA/SMA';

export type ABANDSResult = {
  lower: Big;
  middle: Big;
  upper: Big;
};

/**
 * Acceleration Bands (ABANDS)
 * Type: Volatility
 *
 * Acceleration bands created by Price Headley are set as an envelope around a moving average. The upper and lower
 * bands are of equal distance from the middle band.
 *
 * Two consecutive closes outside Acceleration Bands suggest an entry point in the direction of the breakout (either
 * bullish or bearish). A long position is usually kept till the first close back inside the bands.
 *
 * @param interval The interval that is being used for the three moving averages which create lower, middle and upper
 *   bands
 * @param width A coefficient specifying the distance between the middle band and upper/lower bands
 * @param SmoothingIndicator Which moving average (SMA, EMA, ...) to use
 *
 * @see https://www.tradingtechnologies.com/xtrader-help/x-study/technical-indicator-definitions/acceleration-bands-abands/
 * @see https://www.motivewave.com/studies/acceleration_bands.htm
 * @see https://github.com/QuantConnect/Lean/blob/master/Indicators/AccelerationBands.cs
 * @see https://github.com/twopirllc/pandas-ta/blob/master/pandas_ta/volatility/accbands.py
 */
export const AccelerationBands = (interval: number, width: number, SmoothingIndicator: MovingAverageTypes = SMA) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<ABANDSResult>((subscriber: Subscriber<ABANDSResult>) => {
      const source$ = observable.pipe(
        concatMap(({high, low, close}) => {
          const highPlusLow = new Big(high).plus(low);
          const coefficient = highPlusLow.eq(0) ? new Big(0) : new Big(high).minus(low).div(highPlusLow).times(width);

          // (Low * (1 - width * (High - Low)/ (High + Low)))
          const lowerBand: Big = new Big(low).times(new Big(1).minus(coefficient));
          // (Close)
          const middleBand: Big = new Big(close);
          // (High * ( 1 + width * (High - Low) / (High + Low)))
          const upperBand: Big = new Big(high).times(new Big(1).plus(coefficient));

          return of({
            lowerBand,
            middleBand,
            upperBand,
          });
        }),
        share()
      );
      const subscription = zip(
        source$.pipe(
          map(({lowerBand}) => lowerBand),
          SmoothingIndicator(interval)
        ),
        source$.pipe(
          map(({middleBand}) => middleBand),
          SmoothingIndicator(interval)
        ),
        source$.pipe(
          map(({upperBand}) => upperBand),
          SmoothingIndicator(interval)
        )
      )
        .pipe(
          map(([lowerBand, middleBand, upperBand]) => ({
            lower: new Big(lowerBand),
            middle: new Big(middleBand),
            upper: new Big(upperBand),
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
      };
    });
};
