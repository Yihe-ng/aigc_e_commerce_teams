import React, { useState, useEffect, useCallback } from 'react';
import './NeonStrips.css';

export type NeonState = 'idle' | 'speaking' | 'thinking' | 'hot';

interface NeonStripsProps {
  state?: NeonState;
  audioLevel?: number; // 0-100 音频强度
}

export const NeonStrips: React.FC<NeonStripsProps> = ({ 
  state = 'idle',
  audioLevel = 0 
}) => {
  const [currentState, setCurrentState] = useState<NeonState>(state);
  const [level, setLevel] = useState(audioLevel);

  // 监听状态变化
  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  // 监听音频强度变化
  useEffect(() => {
    setLevel(audioLevel);
  }, [audioLevel]);

  // 获取状态对应的样式类名
  const getStateClass = () => {
    switch (currentState) {
      case 'speaking':
        return 'neon-speaking';
      case 'thinking':
        return 'neon-thinking';
      case 'hot':
        return 'neon-hot';
      default:
        return 'neon-idle';
    }
  };

  // 计算音频可视化亮度
  const getAudioOpacity = () => {
    if (currentState !== 'speaking') return 1;
    return 0.6 + (level / 100) * 0.4; // 0.6 - 1.0 动态变化
  };

  return (
    <div 
      className={`neon-strips-container ${getStateClass()}`}
      style={{ opacity: getAudioOpacity() }}
    >
      {/* 顶部光源发射器 */}
      <div className="light-source-top"></div>
      
      {/* 主霓虹分割线 */}
      <div className="neon-divider">
        {/* 内部发光核心 */}
        <div className="strip-core"></div>
        {/* 中层光晕 */}
        <div className="strip-glow"></div>
      </div>
      
      {/* 外层环境光 - 照亮周围 */}
      <div className="strip-ambient"></div>
      {/* 侧边光晕 - 照亮左右区域 */}
      <div className="strip-side-glow"></div>
      
      {/* 底部光源接收器 */}
      <div className="light-source-bottom"></div>

      {/* 状态指示器 */}
      <div className="state-indicator">
        {currentState === 'thinking' && <span className="thinking-dots">思考中</span>}
        {currentState === 'hot' && <span className="hot-badge">🔥 热卖中</span>}
      </div>
    </div>
  );
};

// 全局状态管理 Hook
export const useNeonState = () => {
  const [state, setState] = useState<NeonState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  // 模拟音频波动
  const simulateSpeaking = useCallback((duration = 5000) => {
    setState('speaking');
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 60 + 20); // 20-80 随机波动
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      setState('idle');
      setAudioLevel(0);
    }, duration);
  }, []);

  const startThinking = useCallback(() => {
    setState('thinking');
  }, []);

  const startHot = useCallback(() => {
    setState('hot');
  }, []);

  const resetToIdle = useCallback(() => {
    setState('idle');
    setAudioLevel(0);
  }, []);

  return {
    state,
    audioLevel,
    setState,
    setAudioLevel,
    simulateSpeaking,
    startThinking,
    startHot,
    resetToIdle
  };
};

export default NeonStrips;
