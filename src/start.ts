import {concatMap, delay, from, of} from 'rxjs';
import {mock} from './mock';
import {TR} from './TR/TR';

console.log('This is what would run if your app gets started.');

from(mock)
  .pipe(
    concatMap(item => of(item).pipe(delay(200))),
    TR()
  )
  .subscribe();
// (x) => console.log(x.toString(), 'result: TR value')
