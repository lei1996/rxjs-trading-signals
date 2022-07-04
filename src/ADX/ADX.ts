import {BigSource} from 'big.js';
import {Observable, Subscriber} from 'rxjs';
import {HighLowClose} from '../utils/HighLowClose';
import {MovingAverageTypes} from '../utils/MovingAverageTypes';
import {WSMA} from '../WSMA/WSMA';
import {DX} from '../DX/DX';

export const ADX = (interval: number, SmoothingIndicator: MovingAverageTypes = WSMA) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<BigSource>((subscriber: Subscriber<BigSource>) => {
      const subscription = observable.pipe(DX(interval, SmoothingIndicator), SmoothingIndicator(interval)).subscribe({
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
