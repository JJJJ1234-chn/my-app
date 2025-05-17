// src/utils/propagateTLE.ts
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
} from 'satellite.js';

export interface EcfPos {
  x: number;
  y: number;
  z: number;
  time: Date;
}

/**
 * 生成某颗卫星未来 90 分钟的 ECF 轨道坐标（每分钟采样一次）
 */
export function propagateTLE(line1: string, line2: string): EcfPos[] {
  const satrec = twoline2satrec(line1, line2);
  const result: EcfPos[] = [];
  const startTime = new Date();

  for (let i = 0; i <= 90; i++) {
    const time = new Date(startTime.getTime() + i * 60 * 1000);
    const gmst = gstime(time);
    const posVel = propagate(satrec, time);

    if (!posVel || !posVel.position) continue;

    const ecf = eciToEcf(posVel.position, gmst);
    result.push({ ...ecf, time });
  }

  return result;
}