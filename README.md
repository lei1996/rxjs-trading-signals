# rxjs-trading-signals

The user - defined operator helps users quickly output index values. 自定义 operator 帮助用户快速输出指标值.

## ❯ Features

- null

## ❯ Installation

```bash
npm i rxjs-trading-signals

or

yarn add rxjs-trading-signals
```

## ❯ Usage

mock.ts file in ./src

```typescript
import {Big} from 'big.js';
import {concatMap, delay, from, of} from 'rxjs';
import {makeIndicatorOperator} from 'rxjs-trading-signals';
import {mock} from './mock';
// TEXT
from(mock)
  .pipe(
    concatMap(item => of(item).pipe(delay(200))),
    makeIndicatorOperator([12, 26, 9])
    // otherOperator...
  )
  .subscribe(([, macdValue]) => console.log(new Big(macdValue).round(8).toString(), 'result: macd value'));

// --- output -----
// 0 result: macd value
// 1.69497248 result: macd value
// 2.73235287 result: macd value
// 0.71234313 result: macd value
// -2.67298721 result: macd value
// -7.10065959 result: macd value
// -14.87535635 result: macd value
// -17.34392961 result: macd value
// -22.30388732 result: macd value
// -27.94657508 result: macd value
// -31.1113651 result: macd value
// -32.15439236 result: macd value
// -29.44852212 result: macd value
// -20.58752864 result: macd value
// -10.69213386 result: macd value
// -7.73928402 result: macd value
// -1.36803217 result: macd value
// 3.42621635 result: macd value
// 9.54475013 result: macd value
// 7.75241762 result: macd value
// 9.17007485 result: macd value
// 7.27142665 result: macd value
// 6.53611403 result: macd value
// 6.48978913 result: macd value
```
