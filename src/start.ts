import {concatMap, filter, from, map, of, share} from 'rxjs';
import {CG as dma1} from 'trading-signals';
import {mock} from './mock';
import {CG} from './CG/CG';

console.log('This is what would run if your app gets started.');
const source$ = from(mock).pipe(
  map(({close, high, low}) => ({close, high, low})),
  share()
);

const dma = new dma1(3, 5);

source$
  .pipe(
    map(({close}) => close),
    concatMap(x => {
      dma.update(x);

      return of(dma).pipe(filter(() => dma.isStable));
    })
  )
  .subscribe(x => console.log(x.getResult().toString(), 'dx ->'));

console.log('--------------------------------');

source$.pipe(map(({close}) => close),CG(3, 5)).subscribe(x => console.log(x.toString(), 'dx ->'));
