// src/App.tsx
import React, { useState } from 'react';
import './App.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import { propagateCircular, propagateTLE, EcfPos } from './orbit';
import { fetchIridiumTLE } from './fetchIridium';
import { OrbitScene } from './OrbitScene';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [orbitType, setOrbitType] = useState<'sun' | 'non' | null>(null);
  const [altitude, setAltitude] = useState<number>(600);
  const [lst, setLst] = useState<string>('11:00');
  const [incl, setIncl] = useState<number>(45);
  const [beamAngle, setBeamAngle] = useState<number>(20);

  const [handshakes, setHandshakes] = useState<number>(0);
  const [outages, setOutages] = useState<number[]>([]);
  const [perMinute, setPerMinute] = useState<number[]>([]);
  const [durationDist, setDurationDist] = useState<Record<number, number>>({});
  const [times, setTimes] = useState<string[]>([]);

  const [beaconMain, setBeaconMain] = useState<EcfPos[]>([]);
  const [beaconOpp, setBeaconOpp] = useState<EcfPos[]>([]);
  const [relayPaths, setRelayPaths] = useState<EcfPos[][]>([]);

  const coneRad = (beamAngle * Math.PI) / 180;

  const handleRun = async () => {
    // 1. 主/副 Beacon 圆轨道
    const mainPath = propagateCircular(
      altitude,
      orbitType === 'sun' ? 97.5 : incl,
      lst,
      0
    );
    const oppPath = propagateCircular(
      altitude,
      orbitType === 'sun' ? 97.5 : incl,
      lst,
      Math.PI
    );

    // 2. 动态拉取并推进 66 颗 Iridium NEXT
    const tleList: [string, string][] = await fetchIridiumTLE();
    const relays: EcfPos[][] = tleList.map(
      ([l1, l2]: [string, string]) => propagateTLE(l1, l2)
    );

    // 3. 通信判定 & 统计
    let total = 0,
      prev = false,
      currOut = 0;
    const outArr: number[] = [],
      mins: number[] = [],
      tLabels: string[] = [];

    for (let i = 0; i < 1440; i++) {
      const bm = mainPath[i],
        bo = oppPath[i];
      const inComm = relays.some((path: EcfPos[]) => {
        const r = path[i];
        const check = (p: EcfPos) => {
          const dot = p.x * r.x + p.y * r.y + p.z * r.z;
          const m1 = Math.hypot(p.x, p.y, p.z);
          const m2 = Math.hypot(r.x, r.y, r.z);
          return dot / (m1 * m2) >= Math.cos(coneRad);
        };
        return check(bm) || check(bo);
      });

      let delta = 0;
      if (inComm && !prev) {
        total++;
        delta = 1;
        if (currOut > 0) {
          outArr.push(currOut);
          currOut = 0;
        }
      }
      if (!inComm) currOut += 60;
      prev = inComm;

      mins.push(delta);
      tLabels.push(
        `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`
      );
    }
    if (!prev && currOut > 0) outArr.push(currOut);

    const dist: Record<number, number> = {};
    outArr.forEach((d: number) => (dist[d] = (dist[d] || 0) + 1));

    // 更新所有 State
    setBeaconMain(mainPath);
    setBeaconOpp(oppPath);
    setRelayPaths(relays);
    setHandshakes(total);
    setOutages(outArr);
    setPerMinute(mins);
    setTimes(tLabels);
    setDurationDist(dist);
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>卫星通信模拟器</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setOrbitType('sun')}>太阳同步</button>
        <button style={{ marginLeft: 8 }} onClick={() => setOrbitType('non')}>
          非极地
        </button>
        {orbitType && (
          <>
            <label style={{ marginLeft: 16 }}>
              高度 (km):
              <input
                type="number"
                value={altitude}
                onChange={(e) => setAltitude(+e.target.value)}
                style={{ marginLeft: 4, width: 80 }}
              />
            </label>
            {orbitType === 'sun' ? (
              <label style={{ marginLeft: 16 }}>
                LST:
                <input
                  type="time"
                  value={lst}
                  onChange={(e) => setLst(e.target.value)}
                  style={{ marginLeft: 4 }}
                />
              </label>
            ) : (
              <label style={{ marginLeft: 16 }}>
                倾角 (°):
                <input
                  type="number"
                  min={30}
                  max={98}
                  value={incl}
                  onChange={(e) => setIncl(+e.target.value)}
                  style={{ marginLeft: 4, width: 60 }}
                />
              </label>
            )}
            <label style={{ marginLeft: 16 }}>
              半顶角 (°):
              <input
                type="number"
                min={1}
                max={90}
                value={beamAngle}
                onChange={(e) => setBeamAngle(+e.target.value)}
                style={{ marginLeft: 4, width: 60 }}
              />
            </label>
            <button style={{ marginLeft: 16 }} onClick={handleRun}>
              开始模拟
            </button>
          </>
        )}
      </div>

      {perMinute.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div>握手总数：{handshakes}</div>
          <div>断连次数：{outages.length}</div>
          <div>总断连时长：{outages.reduce((a, b) => a + b, 0)} s</div>
          <div>
            平均断连时长：
            {(outages.reduce((a, b) => a + b, 0) / outages.length).toFixed(1)} s
          </div>
        </div>
      )}

      {perMinute.length > 0 && (
        <Line
          key={times.join(',')}
          redraw
          data={{
            labels: times,
            datasets: [
              {
                label: '每分钟握手事件',
                data: perMinute,
                fill: false,
                borderColor: 'purple',
                pointRadius: 0,
              },
            ],
          }}
          options={{ animation: false, scales: { x: { display: false } } }}
        />
      )}

      {Object.keys(durationDist).length > 0 && (
        <Bar
          data={{
            labels: Object.keys(durationDist),
            datasets: [
              {
                label: '盲区持续时长分布 (s)',
                data: Object.values(durationDist),
                backgroundColor: 'rgba(100,100,255,0.5)',
              },
            ],
          }}
          options={{ plugins: { legend: { display: false } } }}
        />
      )}

      {beaconMain.length > 0 && (
        <div style={{ width: '100%', height: 500, marginTop: 24 }}>
          <OrbitScene
            beaconMain={beaconMain}
            beaconOpp={beaconOpp}
            relayPaths={relayPaths}
          />
        </div>
      )}
    </div>
  );
}

export default App;