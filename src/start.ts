import {Big} from 'big.js';
import {concatMap, delay, from, of} from 'rxjs';
import {makeIndicatorOperator} from '.';
import {mock} from './mock';

console.log('This is what would run if your app gets started.');

from(mock)
  .pipe(
    concatMap(item => of(item).pipe(delay(200))),
    makeIndicatorOperator([12, 26, 9])
  )
  .subscribe(([, macdValue]) => console.log(new Big(macdValue).round(8).toString(), 'result: macd value'));
