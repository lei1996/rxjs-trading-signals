import Big, {BigSource} from 'big.js';

export const isZero = (x: BigSource) => new Big(x).eq(0);
