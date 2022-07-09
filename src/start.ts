import {from, map, share} from 'rxjs';
import {mock} from './mock';
import {MACD} from './MACD/MACD';
import {EMA} from './EMA/EMA';

console.log('This is what would run if your app gets started.');
const source$ = from(mock).pipe(
  // map(({close, high, low}) => ({close, high, low})),
  map(({close}) => close),
  share()
);

console.log('--------------------------------');

source$
  .pipe(
    MACD({
      indicator: EMA,
      shortInterval: 12,
      longInterval: 26,
      signalInterval: 9,
    })
  )
  .subscribe(({histogram, macd, signal}) =>
    console.log(
      histogram.round(8).toString(),
      macd.round(8).toString(),
      signal.round(8).toString(),
      'result: macd value'
    )
  );
