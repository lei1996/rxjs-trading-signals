# rxjs-trading-signals
trading-signals rxjs version
source lib: https://github.com/bennycode/trading-signals


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
import {MACD, EMA} from 'rxjs-trading-signals';
import {mock} from './mock';
// TEXT
from(mock)
  .pipe(
    concatMap(item => of(item).pipe(delay(200))),
    MACD({
      indicator: EMA,
      shortInterval: 12,
      longInterval: 26,
      signalInterval: 9
    })
    // otherOperator...
  )
  .subscribe(({histogram, macd, signal}) =>
    console.log(histogram.round(8).toString(), macd.round(8).toString(), signal.round(8).toString(), 'result: macd value')
  );

// --- output -----
// 0 6.57186073 6.57186073 result: macd value
// 1.69497248 8.69057633 6.99560385 result: macd value
// 2.73235287 10.41104494 7.67869207 result: macd value
// 0.71234313 8.56912098 7.85677785 result: macd value
// -2.67298721 4.51554384 7.18853105 result: macd value
// -7.10065959 -1.68729344 5.41336615 result: macd value
// -14.87535635 -13.18082928 1.69452706 result: macd value
// -17.34392961 -19.98538495 -2.64145534 result: macd value
// -22.30388732 -30.52131449 -8.21742717 result: macd value
// -27.94657508 -43.15064601 -15.20407094 result: macd value
// -31.1113651 -54.09327731 -22.98191221 result: macd value
// -32.15439236 -63.17490266 -31.0205103 result: macd value
// -29.44852212 -67.83116294 -38.38264083 result: macd value
// -20.58752864 -64.11705163 -43.52952299 result: macd value
// -10.69213386 -56.89469032 -46.20255645 result: macd value
// -7.73928402 -55.87666148 -48.13737746 result: macd value
// -1.36803217 -49.84741768 -48.4793855 result: macd value
// 3.42621635 -44.19661506 -47.62283141 result: macd value
// 9.54475013 -35.69189376 -45.23664388 result: macd value
// 7.75241762 -35.54612186 -43.29853948 result: macd value
// 9.17007485 -31.83594591 -41.00602077 result: macd value
// 7.27142665 -31.91673745 -39.1881641 result: macd value
// 6.53611403 -31.01802157 -37.5541356 result: macd value
// 6.48978913 -29.44189919 -35.93168831 result: macd value
```
