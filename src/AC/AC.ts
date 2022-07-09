import Big from 'big.js';
import {concatMap, map, Observable, of, Subscriber, tap} from 'rxjs';
import {HighLowClose} from '../utils/HighLowClose';
import {AO} from '../AO/AO';
import {SMA} from '../SMA/SMA';
import {MOM} from '../MOM/MOM';

export type ACResult = {
  momentum: Big;
  result: Big;
};

export const AC = (shortAO: number, longAO: number, signalInterval: number) => {
  return (observable: Observable<HighLowClose>) =>
    new Observable<ACResult>((subscriber: Subscriber<ACResult>) => {
      let aoResult: Big = new Big(0);
      let result: Big = new Big(0);

      const subscription = observable
        .pipe(
          AO(shortAO, longAO),
          tap(x => (aoResult = x)),
          SMA(signalInterval),
          concatMap(signalResult => {
            result = aoResult.minus(signalResult);
            return of(result);
          }),
          MOM(1),
          map(momentum => ({momentum, result}))
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
        aoResult = null!;
        result = null!;
      };
    });
};
