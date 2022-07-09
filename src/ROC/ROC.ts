import Big, {BigSource} from 'big.js';
import {Observable, Subscriber, filter, bufferCount, tap, map} from 'rxjs';

/**
 * Rate Of Change Indicator (ROC)
 * Type: Momentum
 *
 * A positive Rate of Change (ROC) signals a high momentum and a positive trend. A decreasing ROC or even negative ROC
 * indicates a downtrend.
 *
 * @see https://www.investopedia.com/terms/r/rateofchange.asp
 */
export const ROC = (interval: number) => {
  return (observable: Observable<BigSource>) =>
    new Observable<Big>((subscriber: Subscriber<Big>) => {
      let price: Big = new Big(0);

      const subscription = observable
        .pipe(
          tap(x => (price = new Big(x))),
          bufferCount(interval + 1, 1),
          filter(x => x.length === interval + 1),
          /**
           * The priceHistory needs to have N prices in it before a result can be calculated with the following value. For
           * an interval of 5, the first result can be given on the 6th value.
           */
          map(([first]) => price.minus(first).div(first))
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
        price = null!;
      };
    });
};
