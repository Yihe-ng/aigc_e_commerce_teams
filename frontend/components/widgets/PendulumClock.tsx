import React, { useState, useEffect } from 'react';
import './PendulumClock.css';

const CyberClock: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    // 只在客户端设置初始时间
    setTime(new Date());
    
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 随机触发 glitch 效果
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
    }, 3000);

    return () => {
      clearInterval(timerId);
      clearInterval(glitchInterval);
    };
  }, []);

  // 服务端渲染时显示占位符，避免 hydration 不匹配
  const hours = time ? time.getHours().toString().padStart(2, '0') : '--';
  const minutes = time ? time.getMinutes().toString().padStart(2, '0') : '--';
  const seconds = time ? time.getSeconds().toString().padStart(2, '0') : '--';
  const milliseconds = time ? Math.floor(time.getMilliseconds() / 10).toString().padStart(2, '0') : '--';

  // 生成随机十六进制代码
  const hexCodes = [
    '0x7F3A', '0x9C2E', '0x4D81', '0xB2F4', '0x1A9C', '0xE7D2'
  ];

  return (
    <div className={`cyber-clock-widget ${glitchActive ? 'glitch' : ''}`}>
      {/* 扫描线背景 */}
      <div className="scanlines" />
      
      {/* 背景十六进制代码 */}
      <div className="hex-background">
        {hexCodes.map((hex, i) => (
          <span key={i} className="hex-code" style={{ animationDelay: `${i * 0.5}s` }}>
            {hex}
          </span>
        ))}
      </div>

      {/* 主容器 - 切角多边形 */}
      <div className="cyber-container">
        {/* 发光边框层 */}
        <div className="cyber-border-glow" />
        
        {/* 内边框 */}
        <div className="cyber-border-inner" />

        {/* 顶部状态栏 */}
        <div className="cyber-header">
          <div className="status-line">
            <span className="status-indicator active" />
            <span className="status-text">SYSTEM ONLINE</span>
          </div>
          <div className="sys-id">UNIT-01</div>
        </div>

        {/* 主时间显示 */}
        <div className="cyber-time-display">
          <div className="time-block">
            <div className="time-value">{hours}</div>
            <div className="time-label">HRS</div>
          </div>
          
          <div className="time-separator">
            <div className="sep-line" />
            <div className="sep-line" />
          </div>
          
          <div className="time-block">
            <div className="time-value">{minutes}</div>
            <div className="time-label">MIN</div>
          </div>
          
          <div className="time-separator">
            <div className="sep-line" />
            <div className="sep-line" />
          </div>
          
          <div className="time-block seconds-block">
            <div className="time-value seconds">{seconds}</div>
            <div className="time-label">SEC</div>
            <div className="milliseconds">.{milliseconds}</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="cyber-progress">
          <div className="progress-label">SYNC RATE</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${time ? (time.getSeconds() / 60) * 100 : 0}%` }} />
          </div>
          <div className="progress-value">{time ? Math.floor((time.getSeconds() / 60) * 100) : 0}%</div>
        </div>

        {/* 底部信息 */}
        <div className="cyber-footer">
          <div className="footer-left">
            <span className="warning-text">⚠ AT FIELD ACTIVE</span>
          </div>
          <div className="footer-right">
            <div className="live-badge">
              <span className="live-dot" />
              <span>LIVE</span>
            </div>
          </div>
        </div>

        {/* 装饰角标 */}
        <div className="corner-target top-left">
          <div className="target-line-h" />
          <div className="target-line-v" />
        </div>
        <div className="corner-target top-right">
          <div className="target-line-h" />
          <div className="target-line-v" />
        </div>
        <div className="corner-target bottom-left">
          <div className="target-line-h" />
          <div className="target-line-v" />
        </div>
        <div className="corner-target bottom-right">
          <div className="target-line-h" />
          <div className="target-line-v" />
        </div>
      </div>

      {/* 外部装饰线 */}
      <div className="external-lines">
        <div className="ext-line line-1" />
        <div className="ext-line line-2" />
        <div className="ext-line line-3" />
      </div>
    </div>
  );
};

export default CyberClock;
