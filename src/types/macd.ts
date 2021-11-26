import {BigSource} from 'big.js';

/**
 * k线的数据 base
 */
export interface KLineBaseInterface {
  id: number; // dateTime
  open: BigSource; // open price
  close: BigSource; // close price
  low: BigSource; // low price
  high: BigSource; // high price
}
