import React, { useState } from 'react';
import { addMinutes, format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

// 地球和星座参数
const EARTH_RADIUS = 6371;                // 地球半径（km）
const MU = 398600.4418;                   // 地心引力常数 μ (km^3/s^2)
const RELAY_ALTITUDE = 781;               // 中继星座高度（km）
const RELAY_INCLINATION = 86 * Math.PI/180; // 中继倾角 (rad)
const RELAY_COUNT = 6;                    // 中继星数量
const CONE_ANGLE = 20 * Math.PI/180;      // 通信锥半顶角 20° (rad)

// 将用户输入的 "HH:MM" LST 转成 0–2π 的相位偏移
function parsePhaseFromLST(lst: string): number {
  const [hh, mm] = lst.split(':').map(Number);
  const seconds = hh * 3600 + mm * 60;
  return (seconds / 86400) * 2 * Math.PI;
}

function App() {
  // 参数状态
  const [orbitType, setOrbitType] = useState<'sun' | 'non' | null>(null);
  const [altitude, setAltitude] = useState<number>(600);
  const [lst, setLst] = useState<string>('11:00');
  const [inclination, setInclination] = useState<number>(45);

  // 结果状态
  const [handshakeCount, setHandshakeCount] = useState<number>(0);
  const [outageCount, setOutageCount] = useState<number>(0);
  const [totalOutageSec, setTotalOutageSec] = useState<number>(0);
  const [avgOutageSec, setAvgOutageSec] = useState<number>(0);
  const [chartData, setChartData] = useState<
    { time: string; handshakes: number }[]
  >([]);

  // 模拟核心函数
  function runSimulation() {
    // 1. 计算信标轨道参数
    const r1 = EARTH_RADIUS + altitude;
    const inc1 = (orbitType === 'sun' ? 97.5 : inclination) * Math.PI/180;
    const T1 = 2 * Math.PI * Math.sqrt(r1**3 / MU);
    const w1 = 2 * Math.PI / T1;

    // 2. 计算中继星座轨道参数
    const r2 = EARTH_RADIUS + RELAY_ALTITUDE;
    const T2 = 2 * Math.PI * Math.sqrt(r2**3 / MU);
    const w2 = 2 * Math.PI / T2;

    // 3. 解析 LST 相位偏移
    const phaseOffset = parsePhaseFromLST(lst);
    console.log('phaseOffset (rad):', phaseOffset.toFixed(3));

    // 4. 初始化统计变量
    let handshakes = 0;
    let inCommPrev = false;
    let currOutage = 0;
    const outageEvents: number[] = [];
    const data: { time: string; handshakes: number }[] = [];

    // 5. 每分钟采样 24h
    let t = new Date();
    t.setHours(0,0,0,0);
    for (let i = 0; i < 1440; i++) {
      const seconds = i * 60;

      // 信标位置（加上 phaseOffset）
      const θ1 = w1 * seconds + phaseOffset;
      const pos1 = {
        x: r1 * Math.cos(θ1),
        y: r1 * Math.sin(θ1) * Math.cos(inc1),
        z: r1 * Math.sin(θ1) * Math.sin(inc1),
      };

      // 与中继星座连通判定
      let inComm = false;
      for (let j = 0; j < RELAY_COUNT; j++) {
        const raan = (2 * Math.PI / RELAY_COUNT) * j;
        const θ2 = w2 * seconds + raan;
        const pos2 = {
          x: r2 * Math.cos(θ2),
          y: r2 * Math.sin(θ2) * Math.cos(RELAY_INCLINATION),
          z: r2 * Math.sin(θ2) * Math.sin(RELAY_INCLINATION),
        };
        const dot = pos1.x*pos2.x + pos1.y*pos2.y + pos1.z*pos2.z;
        const cosAng = dot / (r1 * r2);
        if (cosAng > Math.cos(CONE_ANGLE)) {
          inComm = true;
          break;
        }
      }

      // 握手 & 断连统计
      if (inComm && !inCommPrev) {
        handshakes++;
        if (currOutage > 0) {
          outageEvents.push(currOutage);
          currOutage = 0;
        }
      }
      if (!inComm) {
        currOutage += 60;
      }
      inCommPrev = inComm;

      // 记录图表
      data.push({ time: format(t, 'HH:mm'), handshakes });
      t = addMinutes(t, 1);
    }

    // 结束时检查最后一次断连
    if (!inCommPrev && currOutage > 0) {
      outageEvents.push(currOutage);
    }

    // 汇总断连时长
    const totalOut = outageEvents.reduce((a, b) => a + b, 0);
    const avgOut = outageEvents.length ? totalOut / outageEvents.length : 0;

    // 更新状态
    setHandshakeCount(handshakes);
    setOutageCount(outageEvents.length);
    setTotalOutageSec(totalOut);
    setAvgOutageSec(avgOut);
    setChartData(data);
  }

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>Satellite communication simulator</h1>

      {/* 轨道类型选择 */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            setOrbitType('sun');
            setChartData([]);
          }}
        >
          Sun-synchronous
        </button>
        <button
          onClick={() => {
            setOrbitType('non');
            setChartData([]);
          }}
          style={{ marginLeft: 8 }}
        >
          Non-polar
        </button>
      </div>

      {/* 参数输入 */}
      {orbitType === 'sun' && (
        <div style={{ marginBottom: 16 }}>
          <label>
            altitude(km):
            <input
              type="number"
              value={altitude}
              onChange={e => setAltitude(Number(e.target.value))}
              style={{ marginLeft: 4, width: 80 }}
            />
          </label>
          <label style={{ marginLeft: 16 }}>
            LST:
            <input
              type="time"
              value={lst}
              onChange={e => setLst(e.target.value)}
              style={{ marginLeft: 4 }}
            />
          </label>
        </div>
      )}
      {orbitType === 'non' && (
        <div style={{ marginBottom: 16 }}>
          <label>
            angle(°):
            <input
              type="number"
              min={30}
              max={98}
              value={inclination}
              onChange={e => setInclination(Number(e.target.value))}
              style={{ marginLeft: 4, width: 80 }}
            />
          </label>
          <label style={{ marginLeft: 16 }}>
            altitude(km):
            <input
              type="number"
              value={altitude}
              onChange={e => setAltitude(Number(e.target.value))}
              style={{ marginLeft: 4, width: 80 }}
            />
          </label>
        </div>
      )}

      {/* 开始模拟 */}
      {orbitType && (
        <button onClick={runSimulation} style={{ marginBottom: 24 }}>
          start simulation
        </button>
      )}

      {/* 指标显示 */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div>Total number of handshakes：{handshakeCount}</div>
          <div>Number of disconnections：{outageCount}</div>
          <div>Total disconnection duration：{totalOutageSec} s</div>
          <div>Average disconnection duration：{avgOutageSec.toFixed(1)} s</div>
        </div>
      )}

      {/* 累计握手折线图 */}
      {chartData.length > 0 && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" interval={119} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="handshakes"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;