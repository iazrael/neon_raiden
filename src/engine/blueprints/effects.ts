// src/configs/effects.ts
import { EffectSpec } from '../types';

export const EFFECT_TABLE: Record<string, EffectSpec> = {
  // 基础伤害
  'smallExplosion': {
    type: 'damage',
    value: 120,
    radius: 24,
    duration: 0.15,
  },
  'mediumExplosion': {
    type: 'damage',
    value: 180,
    radius: 32,
    duration: 0.2,
  },
  'largeExplosion': {
    type: 'damage',
    value: 300,
    radius: 48,
    duration: 0.3,
  },

  // 连锁
  'teslaChain': {
    type: 'chain',
    value: 150,
    radius: 80,
    duration: 0.1,
  },

  // 范围扩大
  'areaExpand': {
    type: 'area',
    value: 1.5, // 1.5 倍半径
    radius: 0,
    duration: 5.0,
  },

  // 持续伤害
  'magmaPool': {
    type: 'dot',
    value: 15, // 每秒 15 伤害
    radius: 40,
    duration: 3.0,
  },

  // 连锁闪电
  'teslaChain': {
    type: 'chain',
    value: 150,
    radius: 80,
    duration: 0.1,
  },

  // 无敌
  'invincible': {
    type: 'invincible',
    value: 1, // 秒
    radius: 0,
    duration: 2.0,
  },

  // 速度提升
  'speedBoost': {
    type: 'speed',
    value: 1.3, // 1.3 倍速度
    radius: 0,
    duration: 5.0,
  },

  // 射速提升
  'rapidFire': {
    type: 'rapidFire',
    value: 0.8, // 0.8 倍冷却
    radius: 0,
    duration: 5.0,
  },

  // 穿透提升
  'penetrationBoost': {
    type: 'penetration',
    value: 2, // +2 穿透
    radius: 0,
    duration: 5.0,
  },

  // 护盾提升
  'shieldBoost': {
    type: 'shield',
    value: 50, // +50 护盾
    radius: 0,
    duration: 5.0,
  },
};