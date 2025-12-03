import { BehaviorSubject } from 'rxjs';
import { GameSnapshot } from './world';

export const snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);