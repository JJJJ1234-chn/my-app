import React from 'react';

interface Props {
  onStartSimulation: () => void;
}

const ControlsPanel: React.FC<Props> = ({ onStartSimulation }) => {
  return (
    <div style={{ margin: '1rem 0' }}>
      <button onClick={onStartSimulation}>开始模拟</button>
    </div>
  );
};

export default ControlsPanel;