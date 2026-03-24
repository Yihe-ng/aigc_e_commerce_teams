import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel as PixiLive2DModel, MotionPriority } from 'pixi-live2d-display/cubism4';

interface Live2DModelProps {
  app: PIXI.Application | null;
  modelSrc: string;
  mouthOpenSize?: number;
  width: number;
  height: number;
  scale?: number;
  xOffset?: number;
  yOffset?: number;
  onLoad?: () => void;
}

// 眼神跟随鼠标算法
const calculateEyeTracking = (
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  modelX: number,
  modelY: number
) => {
  // 计算鼠标相对于模型中心的位置
  const deltaX = mouseX - modelX;
  const deltaY = mouseY - modelY;

  // 归一化到 [-1, 1] 范围
  const normalizedX = Math.max(-1, Math.min(1, deltaX / (canvasWidth / 2)));
  const normalizedY = Math.max(-1, Math.min(1, deltaY / (canvasHeight / 2)));

  // 应用平滑系数和限制范围
  const eyeX = normalizedX * 0.8; // 左右眼球移动
  const eyeY = -normalizedY * 0.6; // 上下眼球移动（Y轴需要反转）

  // 计算头部跟随角度（比眼睛移动幅度小）
  const headAngleX = normalizedX * 15; // 头部左右转动角度
  const headAngleY = -normalizedY * 10; // 头部上下转动角度

  return {
    eyeX,
    eyeY,
    headAngleX,
    headAngleY,
  };
};

export const Live2DModel: React.FC<Live2DModelProps> = ({
  app,
  modelSrc,
  mouthOpenSize = 0,
  width,
  height,
  scale = 1,
  xOffset = 0,
  yOffset = 0,
  onLoad,
}) => {
  const modelRef = useRef<PixiLive2DModel | null>(null);
  const mouseRef = useRef({ x: width / 2, y: height / 2 });
  const targetRef = useRef({ eyeX: 0, eyeY: 0, headAngleX: 0, headAngleY: 0 });
  const currentRef = useRef({ eyeX: 0, eyeY: 0, headAngleX: 0, headAngleY: 0 });

  // 加载模型
  useEffect(() => {
    console.log("Live2DModel useEffect triggered, app:", app, "modelSrc:", modelSrc);

    if (!app || !app.stage) {
      console.log("App or app.stage is null, skipping model load");
      return;
    }

    let isCancelled = false;

    const loadModel = async () => {
      try {
        console.log("正在加载模型:", modelSrc);
        const model = await PixiLive2DModel.from(modelSrc);
        console.log("模型加载成功:", model);

        if (isCancelled) {
          model.destroy();
          return;
        }

        if (app && app.stage) {
          console.log("Adding model to stage");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app.stage.addChild(model as any);
          modelRef.current = model;

          // 设置基础配置
          model.anchor.set(0.5, 0.5);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (model as any).eventMode = 'static';

          // 初始动作
          const internalModel = model.internalModel as any;
          if (internalModel?.motionManager) {
            internalModel.motionManager.startRandomMotion('Idle', MotionPriority.IDLE);
          }

          onLoad?.();

          // 加载完成后手动触发一次位置更新
          updateTransform();
          console.log("Model setup complete");

          // 启动眼神跟随动画循环
          startEyeTracking();
        }
      } catch (error) {
        console.error('Failed to load Live2D model:', error);
      }
    };

    // 鼠标移动事件处理
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = app.view as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // 眼神跟随动画循环
    let animationId: number;
    const startEyeTracking = () => {
      const animate = () => {
        const model = modelRef.current;
        if (!model) {
          animationId = requestAnimationFrame(animate);
          return;
        }

        // 计算目标值
        const modelX = width / 2 + xOffset;
        const modelY = height * 0.65 + yOffset;
        const target = calculateEyeTracking(
          mouseRef.current.x,
          mouseRef.current.y,
          width,
          height,
          modelX,
          modelY
        );

        targetRef.current = target;

        // 平滑插值（Lerp）
        const lerpFactor = 0.08;
        currentRef.current.eyeX += (target.eyeX - currentRef.current.eyeX) * lerpFactor;
        currentRef.current.eyeY += (target.eyeY - currentRef.current.eyeY) * lerpFactor;
        currentRef.current.headAngleX += (target.headAngleX - currentRef.current.headAngleX) * lerpFactor;
        currentRef.current.headAngleY += (target.headAngleY - currentRef.current.headAngleY) * lerpFactor;

        // 应用到模型参数
        const coreModel = (model.internalModel as any)?.coreModel;
        if (coreModel) {
          // 眼球移动
          coreModel.setParameterValueById('ParamEyeBallX', currentRef.current.eyeX);
          coreModel.setParameterValueById('ParamEyeBallY', currentRef.current.eyeY);

          // 头部跟随（轻微转动）
          coreModel.setParameterValueById('ParamAngleX', currentRef.current.headAngleX);
          coreModel.setParameterValueById('ParamAngleY', currentRef.current.headAngleY);
        }

        animationId = requestAnimationFrame(animate);
      };
      animate();
    };

    loadModel();

    // 添加鼠标事件监听
    const canvas = app.view as HTMLCanvasElement;
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      console.log("Live2DModel cleanup");
      isCancelled = true;
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (modelRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (app && app.stage && app.stage.children.includes(modelRef.current as any)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app.stage.removeChild(modelRef.current as any);
        }
        modelRef.current.destroy();
        modelRef.current = null;
      }
    };
  }, [app, modelSrc, width, height, xOffset, yOffset]);

  // 更新位置和缩放 - 半身特写构图（再放大30%）
  const updateTransform = () => {
    const model = modelRef.current;
    if (!model) return;

    // 半身特写：放大 2.3 倍（原1.8倍 + 30%），聚焦上半身
    const baseScale = Math.min(
      (width * 1.2) / model.width,
      (height * 1.5) / model.height
    );
    const initialScale = baseScale * scale * 2.3; // 额外放大 2.3 倍

    model.scale.set(initialScale);
    
    // 向左偏移，右侧留出空间展示弹幕/产品
    const xPosition = width * 0.42 + xOffset; // 从 0.5 改为 0.42，偏左放置
    
    // 垂直位置调整
    const yPosition = height * 0.68 + yOffset; // 稍微向下调整
    
    model.position.set(
      xPosition,
      yPosition
    );
  };

  useEffect(() => {
    updateTransform();
  }, [width, height, scale, xOffset, yOffset]);

  // 更新嘴巴开口度
  useEffect(() => {
    if (modelRef.current?.internalModel) {
      const coreModel = (modelRef.current.internalModel as any).coreModel;
      if (coreModel) {
        coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenSize);
      }
    }
  }, [mouthOpenSize]);

  return null;
};
