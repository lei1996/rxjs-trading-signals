import Big, {BigSource} from 'big.js';
import {concatMap, map, Observable, of, share, Subscriber, zip} from 'rxjs';
import {HighLowClose} from '../utils/HighLowClose';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {WSMA} from '../WSMA/WSMA';
import {ATR} from '../ATR/ATR';

export const DX = (interval: number, SmoothingIndicator: MovingAverageTypes = WSMA) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      let prevCandle: HighLowClose;

      const source$ = observable.pipe(
        concatMap((candle, i) => {
          if (i === 0) {
            prevCandle = candle;

            return of({
              candle,
              pdm: 0,
              mdm: 0,
            });
          }
          const currentHigh = new Big(candle.high);
          const previousHigh = new Big(prevCandle.high);

          const currentLow = new Big(candle.low);
          const previousLow = new Big(prevCandle.low);

          const higherHigh = currentHigh.minus(previousHigh);
          const lowerLow = previousLow.minus(currentLow);

          const noHigherHighs = higherHigh.lt(0);
          const lowsRiseFaster = higherHigh.lt(lowerLow);

          // Plus Directional Movement (+DM)
          const pdm = noHigherHighs || lowsRiseFaster ? new Big(0) : higherHigh;

          const noLowerLows = lowerLow.lt(0);
          const highsRiseFaster = lowerLow.lt(higherHigh);

          // Minus Directional Movement (-DM)
          const mdm = noLowerLows || highsRiseFaster ? new Big(0) : lowerLow;

          prevCandle = candle;

          return of({
            candle,
            pdm,
            mdm,
          });
        }),
        share()
      );

      const subscription = zip(
        source$.pipe(
          map(({candle}) => candle),
          ATR(interval, SmoothingIndicator)
        ),
        source$.pipe(
          map(({mdm}) => mdm),
          SmoothingIndicator(interval)
        ),
        source$.pipe(
          map(({pdm}) => pdm),
          SmoothingIndicator(interval)
        )
      )
        .pipe(
          concatMap(([atr, movesDown, movesUp]) => {
            const pdi = new Big(movesUp).div(atr);
            const mdi = new Big(movesDown).div(atr);

            const dmDiff = pdi.minus(mdi).abs();
            const dmSum = pdi.plus(mdi);

            // Prevent division by zero
            if (dmSum.eq(0)) {
              return of(new Big(0));
            }

            return of(dmDiff.div(dmSum).times(100));
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
        prevCandle = null!;
      };
    });
};
