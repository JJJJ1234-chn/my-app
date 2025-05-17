// src/simulation/handshakeLogic.ts

import { Vector3 } from 'three';

export interface SatellitePosition {
  name: string;
  position: Vector3; // 使用三维向量表示卫星位置
}

export interface HandshakeEvent {
  time: Date;
  beacon: string;
  relay: string;
  distance: number; // 单位：公里
  angle: number;    // 单位：度
}

/**
 * 计算两个卫星之间的夹角（单位：度）
 */
function calculateAngle(vec1: Vector3, vec2: Vector3): number {
  const dotProduct = vec1.dot(vec2);
  const magnitudeProduct = vec1.length() * vec2.length();
  const cosTheta = dotProduct / magnitudeProduct;
  const angleRad = Math.acos(Math.min(Math.max(cosTheta, -1), 1)); // 防止数值误差
  return (angleRad * 180) / Math.PI;
}

/**
 * 判断两个卫星是否可以进行握手通信
 * @param beacon - 信标卫星
 * @param relay - 中继卫星
 * @param maxDistance - 最大通信距离（单位：公里）
 * @param maxAngle - 最大夹角（单位：度）
 * @returns 是否可以握手
 */
export function canHandshake(
  beacon: SatellitePosition,
  relay: SatellitePosition,
  maxDistance: number,
  maxAngle: number
): boolean {
  const relativePosition = new Vector3().subVectors(relay.position, beacon.position);
  const distance = relativePosition.length();

  if (distance > maxDistance) {
    return false;
  }

  const beaconToRelay = relativePosition.clone().normalize();
  const beaconHorizon = beacon.position.clone().normalize(); // 假设天线指向地平线
  const angle = calculateAngle(beaconToRelay, beaconHorizon);

  return angle <= maxAngle;
}

/**
 * 模拟一天内的握手事件
 * @param beaconPositions - 信标卫星的位置列表
 * @param relayPositions - 中继卫星的位置列表
 * @param maxDistance - 最大通信距离（单位：公里）
 * @param maxAngle - 最大夹角（单位：度）
 * @returns 握手事件列表
 */
export function simulateHandshakes(
  beaconPositions: SatellitePosition[],
  relayPositions: SatellitePosition[],
  maxDistance: number,
  maxAngle: number
): HandshakeEvent[] {
  const events: HandshakeEvent[] = [];

  for (const beacon of beaconPositions) {
    for (const relay of relayPositions) {
      if (canHandshake(beacon, relay, maxDistance, maxAngle)) {
        const distance = beacon.position.distanceTo(relay.position);
        const angle = calculateAngle(
          relay.position.clone().sub(beacon.position),
          beacon.position.clone().normalize()
        );
        events.push({
          time: new Date(), // 此处应替换为实际时间
          beacon: beacon.name,
          relay: relay.name,
          distance,
          angle,
        });
      }
    }
  }

  return events;
}