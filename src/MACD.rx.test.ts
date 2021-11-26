import {throttleTime} from 'rxjs';

import {TestScheduler} from 'rxjs/testing';

const testScheduler = new TestScheduler((actual, expected) => {
  // asserting the two objects are equal - required
  // for TestScheduler assertions to work via your test framework
  // e.g. using chai.
  //   expect(actual).deep.equal(expected);
  expect(actual).toEqual(expected);
});

describe('MACD.rx', () => {
  describe('return macd value', () => {
    it('return macd value', () => {
      testScheduler.run(helpers => {
        const {cold, time, expectObservable, expectSubscriptions} = helpers;
        const e1 = cold(' -a--b--c---|');
        const e1subs = '  ^----------!';
        const t = time('   ---|       '); // t = 3
        const expected = '-a-----c---|';

        expectObservable(e1.pipe(throttleTime(t))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
      });

      //   from(mock)
      //     .pipe(
      //       concatMap(item => of(item).pipe(delay(200))),
      //       makeIndicatorOperator([12, 26, 9])
      //     )
      //     .subscribe(x => console.log(x, 'result: macd value'));

      //   expect(myInstance.returnHello()).toBe('Hello');
    });
  });
});
