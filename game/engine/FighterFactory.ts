import { FighterEntity } from '@/types';
import { PlayerConfig } from '../config/player';
import { Starfighter } from '../entities/Starfighter';
import { EventBus } from './EventBus';
import { EventPayloads } from './events';

export class FighterFactory {
  static createById(id: string, x: number, y: number, bus: EventBus<EventPayloads>) {
    if (id === PlayerConfig.id) return new Starfighter(PlayerConfig, x, y, bus);
    return new Starfighter(PlayerConfig, x, y, bus);
  }

  static createByConfig(config: FighterEntity, x: number, y: number, bus: EventBus<EventPayloads>) {
    return new Starfighter(config, x, y, bus);
  }
}

