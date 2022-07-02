import Big, {BigSource} from 'big.js';
import {from, max, Observable, concatMap, of, Subscriber} from 'rxjs';
import {HighLowClose} from '../utils/HighLowClose';

export const TR = () => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      let prevCandle: HighLowClose | null = null;

      const subscription = observable
        .pipe(
          concatMap(candle => {
            const high = new Big(candle.high);
            const highLow = high.minus(candle.low);
            if (!prevCandle) {
              prevCandle = candle;
              return of(highLow);
            }
            const highClose = high.minus(prevCandle.close).abs();
            const lowClose = new Big(candle.low).minus(prevCandle.close).abs();
            prevCandle = candle;
            return from([highLow, highClose, lowClose]).pipe(max((a, b) => (new Big(a).lt(b) ? -1 : 1)));
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
