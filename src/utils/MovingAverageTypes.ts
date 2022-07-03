import {EMA} from '../EMA/EMA';
import {WSMA} from '../WSMA/WSMA';
import {SMA} from '../SMA/SMA';

export type MovingAverageTypes = typeof EMA | typeof SMA | typeof WSMA;
