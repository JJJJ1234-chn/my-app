import React from 'react';

interface StatsDisplayProps {
  totalHandshakes: number;
  disconnectionCount: number;
  totalDowntime: number;      // 单位：秒
  averageDowntime: number;    // 单位：秒
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  totalHandshakes,
  disconnectionCount,
  totalDowntime,
  averageDowntime,
}) => {
  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '1rem',
        borderRadius: '8px',
        margin: '1rem 0',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h3>📊 模拟统计结果</h3>
      <p><strong>握手总数：</strong>{totalHandshakes}</p>
      <p><strong>断连次数：</strong>{disconnectionCount}</p>
      <p><strong>总断连时长：</strong>{totalDowntime} 秒</p>
      <p><strong>平均断连时长：</strong>{isNaN(averageDowntime) ? '—' : `${averageDowntime} 秒`}</p>
    </div>
  );
};

export default StatsDisplay;