import {Observable, Subscriber} from 'rxjs';
import {BigSource} from 'big.js';
import {EMA, MACD} from 'trading-signals';

import {KLineBaseInterface} from './types/macd';

export const makeIndicatorOperator = (macdParam: number[]) => {
  return (observable: Observable<KLineBaseInterface>) =>
    new Observable<[KLineBaseInterface, BigSource]>((subscriber: Subscriber<[KLineBaseInterface, BigSource]>) => {
      const [shortInterval, longInterval, signalInterval] = macdParam;
      // how to use RSI or ADX or ? ...
      let indicator = new MACD({
        indicator: EMA,
        shortInterval: shortInterval,
        longInterval: longInterval,
        signalInterval: signalInterval,
      });

      const subscription = observable.subscribe({
        next(item) {
          const {close} = item;
          // console.log(item, '<- kline data');

          indicator.update(close);

          if (indicator.isStable) {
            const {histogram} = indicator.getResult();
            subscriber.next([item, histogram]);
          }
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
        indicator = null!;
      };
    });
};
