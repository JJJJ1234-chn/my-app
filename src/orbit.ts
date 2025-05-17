// src/orbit.ts
import * as sat from 'satellite.js';

export interface EcfPos {
  x: number;
  y: number;
  z: number;
}

/** 用真实 TLE 推进 1440 点全天 ECF（米） */
export function propagateTLE(line1: string, line2: string): EcfPos[] {
  const satrec = sat.twoline2satrec(line1, line2);
  const positions: EcfPos[] = [];
  const start = new Date();
  for (let i = 0; i < 1440; i++) {
    const now = new Date(start.getTime() + i * 60000);
    const gmst = sat.gstime(now);
    const pv = sat.propagate(satrec, now);
    if (pv?.position) {
      const ecf = sat.eciToEcf(pv.position, gmst);
      positions.push({ x: ecf.x * 1000, y: ecf.y * 1000, z: ecf.z * 1000 });
    } else {
      positions.push({ x: 0, y: 0, z: 0 });
    }
  }
  return positions;
}

/** 简化圆轨道：1440 点全天 ECF（米） */
export function propagateCircular(
  altitude: number,
  inclinationDeg: number,
  lst: string,
  raanOffsetRad: number = 0
): EcfPos[] {
  const MU = 398600.4418;
  const R_E = 6371;
  const r = R_E + altitude;
  const incRad = (inclinationDeg * Math.PI) / 180;
  const [hh, mm] = lst.split(':').map((v) => parseInt(v, 10));
  const phase0 = ((hh * 3600 + mm * 60) / 86400) * 2 * Math.PI;
  const T = 2 * Math.PI * Math.sqrt((r ** 3) / MU);
  const ω = (2 * Math.PI) / T;

  const out: EcfPos[] = [];
  for (let i = 0; i < 1440; i++) {
    const θ = ω * i * 60 + phase0;
    const x1 = r * Math.cos(θ),
      y1 = r * Math.sin(θ);
    const y2 = y1 * Math.cos(incRad),
      z2 = y1 * Math.sin(incRad);
    const x = x1 * Math.cos(raanOffsetRad) - y2 * Math.sin(raanOffsetRad);
    const y = x1 * Math.sin(raanOffsetRad) + y2 * Math.cos(raanOffsetRad);
    out.push({ x: x * 1000, y: y * 1000, z: z2 * 1000 });
  }
  return out;
}