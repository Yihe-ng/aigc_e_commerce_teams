import React, { useEffect, useRef, useState } from 'react';
import './EcommerceLive.css';
import PendulumClock from '../components/widgets/PendulumClock';
import MinimalClock from '../components/widgets/MinimalClock';
import NeonStrips, { useNeonState } from '../components/widgets/NeonStrips';

// 动态导入 PIXI 和 Live2D，避免 SSR 问题
let PIXI: typeof import('pixi.js') | null = null;
let Live2DModel: typeof import('pixi-live2d-display/cubism4').Live2DModel | null = null;

type CubismWindow = Window & {
  Live2DCubismCore?: unknown;
};

type Live2DModelWithTicker = typeof import('pixi-live2d-display/cubism4').Live2DModel & {
  registerTicker: (ticker: typeof import('pixi.js').Ticker) => void;
};

type InteractiveLive2DModel = import('pixi-live2d-display/cubism4').Live2DModel & {
  on: (event: 'hit', handler: (hitAreas: string[]) => void) => void;
  motion: (name: string) => void;
};

const EcommerceLive: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'product'>('chat');
  const [chatMessages, setChatMessages] = useState([
    { user: '系统通知', message: '欢迎来到 AIGC 智能直播间！', level: 'SYS', color: '#ff4d4f' },
    { user: '用户_K7', message: '主播能介绍下这款耳机吗？', level: 'UL12', color: '#00aeec' },
    { user: '小海豹', message: '这个耳机音质怎么样？', level: 'UL8', color: '#fb7299' },
    { user: '科技迷', message: '已下单，期待发货！', level: 'UL15', color: '#52c41a' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  // 霓虹灯带状态管理
  const { state: neonState, audioLevel, setState: setNeonState, setAudioLevel } = useNeonState();

  // 等待 Cubism 运行时加载
  const waitForCubismRuntime = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      // 检查 Cubism 运行时是否已加载
      if ((window as CubismWindow).Live2DCubismCore) {
        resolve();
        return;
      }
      // 等待脚本加载
      const checkInterval = setInterval(() => {
        if ((window as CubismWindow).Live2DCubismCore) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      // 超时处理（10秒）
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Cubism runtime load timeout');
        resolve();
      }, 10000);
    });
  };

  // Live2D 初始化
  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === 'undefined') return;

    let app: import('pixi.js').Application | null = null;
    let model: import('pixi-live2d-display/cubism4').Live2DModel | null = null;
    const container = containerRef.current;

    const initLive2D = async () => {
      try {
        // 等待 Cubism 运行时加载
        await waitForCubismRuntime();

        // 动态导入库
        if (!PIXI) {
          PIXI = await import('pixi.js');
        }
        if (!Live2DModel) {
          const live2dModule = await import('pixi-live2d-display/cubism4');
          Live2DModel = live2dModule.Live2DModel;
        }

        // 注册 Live2D ticker
        (Live2DModel as Live2DModelWithTicker).registerTicker(PIXI.Ticker);

        // 获取容器尺寸
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        console.log('Container size:', containerWidth, containerHeight);
        
        // 确保容器有定位
        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        // 创建 canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.id = 'live2d-canvas';
        container.appendChild(canvas);

        // 初始化 PIXI Application - 使用最简单的配置
        app = new PIXI.Application({
          view: canvas,
          width: containerWidth,
          height: containerHeight,
          backgroundAlpha: 0,
          antialias: false,
          resolution: 1,
          autoDensity: false,
        });

        console.log('Pixi app created:', app);
        console.log('Pixi stage:', app.stage);

        if (!app.stage) {
          throw new Error('Pixi stage is null');
        }

        // 使用本地 Cubism 4 模型
        const modelUrl = '/models/runtime/hiyori_pro_t11.model3.json';
        console.log('Loading model:', modelUrl);

        // 加载模型
        model = await Live2DModel.from(modelUrl);
        console.log('Model loaded:', model);

        app.stage.addChild(model);

        // 计算缩放比例 - 放大30%，偏左放置
        const scaleX = (containerWidth * 0.9) / model.width;
        const scaleY = (containerHeight * 0.95) / model.height;
        const baseScale = Math.min(scaleX, scaleY);
        const scale = baseScale * 1.3; // 额外放大30%

        model.scale.set(scale);
        model.anchor.set(0.5, 0.5);
        // 偏左放置（42%位置），垂直位置稍微下调
        const modelX = containerWidth * 0.42;
        const modelY = containerHeight * 0.65;
        model.position.set(modelX, modelY);
        
        console.log('Model position:', modelX, modelY);
        console.log('Model anchor:', model.anchor.x, model.anchor.y);
        console.log('Canvas size:', canvas.width, canvas.height);

        // 添加交互
        (model as InteractiveLive2DModel).on('hit', (hitAreas: string[]) => {
          if (hitAreas.includes('body')) {
            (model as InteractiveLive2DModel).motion('TapBody');
          }
        });

        console.log('Live2D 模型加载成功:', model.width, model.height, scale);
      } catch (error) {
        console.error('Live2D 初始化失败:', error);
      }
    };

    // 延迟初始化，确保 DOM 完全准备好
    const timer = setTimeout(() => {
      initLive2D();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (model) {
        model.destroy();
      }
      if (app) {
        app.destroy(true);
      }
      // 清理 canvas
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.remove();
      }
    };
  }, []);

  // 发送消息
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setChatMessages([...chatMessages, { user: '我', message: inputMessage, level: 'UL5', color: '#00aeec' }]);
    setInputMessage('');
  };

  return (
    <div className="ecommerce-live">
      <header className="header">
        <div className="logo-area">
          <span className="logo-icon">✦</span>
          <span className="logo-text">AITuber Live</span>
        </div>
        <div className="header-right">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
          <div className="viewer-count">
            <span className="viewer-icon">👥</span>
            <span>1.2k</span>
          </div>
        </div>
      </header>

      <main className="main-container">
        {/* 左侧直播区域 */}
        <div className="live-column">
          <MinimalClock />
          <div className="host-info">
            <div className="avatar"></div>
            <div className="host-details">
              <div className="host-name">桃瀬 Seal (AI Agent)</div>
              <div className="host-topic">正在为你讲解：智能数码新品</div>
            </div>
            <div className="live-status">● LIVE 03:24</div>
          </div>

          {/* 霓虹分割线 - 放在live-column级别，相对于它定位 */}
          <NeonStrips state={neonState} audioLevel={audioLevel} />
          
          <div className="live2d-view" ref={containerRef}>
            {/* 直播间装饰元素 */}
            <div className="stage-decoration">
              {/* 底部舞台光 */}
              <div className="stage-light"></div>
              {/* 品牌 Logo 装饰 */}
              <div className="brand-badge">
                <span className="brand-icon">🎵</span>
                <span className="brand-text">Hi-Res Audio</span>
              </div>
              {/* 产品展示角标 */}
              <div className="product-corner">
                <div className="corner-item">
                  <span className="corner-icon">🎧</span>
                  <span className="corner-text">新品首发</span>
                </div>
              </div>
            </div>
            <PendulumClock />
            
            {/* 霓虹灯带状态控制面板 - 用于演示 */}
            <div className="neon-control-panel">
              <div className="neon-control-title">💡 灯带状态演示</div>
              <div className="neon-controls">
                <button 
                  className={`neon-btn ${neonState === 'idle' ? 'active' : ''}`}
                  onClick={() => setNeonState('idle')}
                >
                  待机
                </button>
                <button 
                  className={`neon-btn ${neonState === 'speaking' ? 'active' : ''}`}
                  onClick={() => {
                    setNeonState('speaking');
                    // 模拟音频波动
                    const interval = setInterval(() => {
                      setAudioLevel(Math.random() * 60 + 20);
                    }, 100);
                    setTimeout(() => {
                      clearInterval(interval);
                      setNeonState('idle');
                    }, 3000);
                  }}
                >
                  说话
                </button>
                <button 
                  className={`neon-btn ${neonState === 'thinking' ? 'active' : ''}`}
                  onClick={() => setNeonState('thinking')}
                >
                  思考中
                </button>
                <button 
                  className={`neon-btn ${neonState === 'hot' ? 'active' : ''}`}
                  onClick={() => setNeonState('hot')}
                >
                  🔥 热卖
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧评论/商品区域 */}
        <div className="chat-column">
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              互动聊天
            </div>
            <div
              className={`tab ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => setActiveTab('product')}
            >
              推荐商品
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="chat-list">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="chat-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="chat-header">
                      <span className="user-level" style={{ backgroundColor: msg.color }}>{msg.level}</span>
                      <span className="chat-user">{msg.user}</span>
                    </div>
                    <span className="chat-message">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="input-bar">
                <input
                  type="text"
                  placeholder="输入消息参与互动..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>发送</button>
              </div>
            </>
          ) : (
            <div className="product-list">
              <div className="product-card">
                <div className="product-image"></div>
                <div className="product-info">
                  <div className="product-name">智能降噪耳机 Pro</div>
                  <div className="product-price">¥299</div>
                  <button className="buy-btn">立即购买</button>
                </div>
              </div>
              <div className="product-card">
                <div className="product-image"></div>
                <div className="product-info">
                  <div className="product-name">无线充电器</div>
                  <div className="product-price">¥99</div>
                  <button className="buy-btn">立即购买</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EcommerceLive;
