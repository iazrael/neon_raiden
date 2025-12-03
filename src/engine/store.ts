import { BehaviorSubject } from 'rxjs';
import { GameSnapshot } from './types';

export const snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);