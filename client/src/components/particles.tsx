import { useEffect, useRef } from 'react';
import { useColorMode } from '../utils/darkModeUtils';

// 定义 particles.js 配置的类型
type ParticleOptions = {
  particles?: {
    number?: {
      value?: number;
      density?: {
        enable?: boolean;
        value_area?: number;
      };
    };
    color?: {
      value?: string;
    };
    shape?: {
      type?: string | string[];
      stroke?: {
        width?: number;
        color?: string;
      };
      polygon?: {
        nb_sides?: number;
      };
    };
    opacity?: {
      value?: number;
      random?: boolean;
      anim?: {
        enable?: boolean;
        speed?: number;
        opacity_min?: number;
        sync?: boolean;
      };
    };
    size?: {
      value?: number;
      random?: boolean;
      anim?: {
        enable?: boolean;
        speed?: number;
        size_min?: number;
        sync?: boolean;
      };
    };
    line_linked?: {
      enable?: boolean;
      distance?: number;
      color?: string;
      opacity?: number;
      width?: number;
    };
    move?: {
      enable?: boolean;
      speed?: number;
      direction?: string;
      random?: boolean;
      straight?: boolean;
      out_mode?: string;
      bounce?: boolean;
      attract?: {
        enable?: boolean;
        rotateX?: number;
        rotateY?: number;
      };
    };
  };
  interactivity?: {
    detect_on?: string;
    events?: {
      onhover?: {
        enable?: boolean;
        mode?: string | string[];
      };
      onclick?: {
        enable?: boolean;
        mode?: string | string[];
      };
      resize?: boolean;
    };
    modes?: {
      grab?: {
        distance?: number;
        line_linked?: {
          opacity?: number;
        };
      };
      bubble?: {
        distance?: number;
        size?: number;
        duration?: number;
        opacity?: number;
        speed?: number;
      };
      repulse?: {
        distance?: number;
        duration?: number;
      };
      gather?: {
        distance?: number;
        radius?: number;
        strength?: number;
        swirl?: number;
        max?: number;
        escape?: number;
      };
      push?: {
        particles_nb?: number;
      };
      remove?: {
        particles_nb?: number;
      };
    };
  };
  retina_detect?: boolean;
};

// 声明全局粒子JS对象
declare global {
  interface Window {
    particlesJS: (container: string | Element, options: ParticleOptions) => void;
    pJSDom: Array<{
      pJS: {
        particles: {
          array?: Array<{
            x?: number;
            y?: number;
            radius?: number;
            color?: {
              r?: number;
              g?: number;
              b?: number;
            };
            opacity?: number;
            velocity?: {
              x?: number;
              y?: number;
            };
            links?: Array<{
                source?: {
                  x?: number;
                  y?: number;
                  radius?: number;
                  color?: {
                    r?: number;
                    g?: number;
                    b?: number;
                  };
                  opacity?: number;
                };
                destination?: {
                  x?: number;
                  y?: number;
                  radius?: number;
                  color?: {
                    r?: number;
                    g?: number;
                    b?: number;
                  };
                  opacity?: number;
                };
                opacity?: number;
                width?: number;
              }>;
          }>;
        };
        fn: {
          vendors: {
            destroypJS: () => void;
          };
        };
      };
    }>;
    Stats: {
      new: () => {
        setMode: (mode: number) => void;
        domElement: HTMLElement;
        begin: () => void;
        end: () => void;
      };
    };
  }
}

interface ParticlesProps {
  id?: string;
  options?: ParticleOptions;
}

export const Particles = ({ id = 'particles-js', options }: ParticlesProps) => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const colorMode = useColorMode();

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    // particles.js 是 index.html 中的本地脚本，正常情况下几毫秒内即就绪；
    // 设置重试上限（约 5s）作为兜底，避免极端情况下无限空转，而非内存泄露。
    const MAX_RETRIES = 100;

    const initParticles = () => {
      if (cancelled) return;
      // particles.js 通过全局 <script> 加载，整页刷新后可能尚未就绪；
      // 未就绪时轮询重试，避免初始化被一次性条件跳过导致粒子永久丢失。
      if (typeof window === 'undefined' || !window.particlesJS) {
        if (retries >= MAX_RETRIES) {
          console.warn('particles.js 未在预期时间内加载，放弃初始化粒子特效');
          return;
        }
        retries += 1;
        retryTimer = setTimeout(initParticles, 50);
        return;
      }

      // 根据主题确定粒子颜色
      const particleColor = colorMode === 'dark' ? '#ffffff' : '#333333';

      // 默认配置 - 移除了无法访问的背景图片
      const defaultOptions: ParticleOptions = {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: particleColor },
          shape: {
            type: 'star',
            stroke: { width: 0, color: particleColor },
            polygon: { nb_sides: 5 },
          },
          opacity: {
            value: 0.5,
            random: false,
            anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
          },
          size: {
            value: 4,
            random: true,
            anim: { enable: false, speed: 40, size_min: 0.1, sync: false },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: particleColor,
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 6,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 },
          },
        },
        interactivity: {
          detect_on: 'window',
          events: {
            onhover: { enable: true, mode: ['grab', 'gather'] },
            onclick: { enable: true, mode: 'push' },
            resize: true,
          },
          modes: {
            grab: { distance: 220, line_linked: { opacity: 0.8 } },
            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            gather: { distance: 320, radius: 120, strength: 2.0, swirl: 1.3, max: 45, escape: 1.5 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      };

      try {
        // 清理旧的粒子特效，避免整页刷新/主题切换后残留多个实例
        if (window.pJSDom && window.pJSDom.length > 0) {
          window.pJSDom.forEach((pJS) => {
            try {
              pJS.pJS?.fn?.vendors?.destroypJS?.();
            } catch {
              /* 忽略单个实例销毁失败 */
            }
          });
        }

        // 确保全局 pJSDom 数组存在（destroypJS 会将其置为 null，否则下次 push 报错）
        window.pJSDom = window.pJSDom || [];
        // 初始化粒子特效
        window.particlesJS(id, options || defaultOptions);
      } catch (error) {
        console.error('粒子特效初始化失败:', error);
      }

      // 设置粒子画布的 pointer-events 为 auto，以接收鼠标事件
      setTimeout(() => {
        const canvas = particlesRef.current?.querySelector('canvas');
        if (canvas) {
          (canvas as HTMLElement).style.pointerEvents = 'auto';
        }
      }, 100); // 稍微延迟以确保 canvas 已创建
    };

    initParticles();

    // 清理函数
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      // 检查是否在浏览器环境中
      if (typeof window !== 'undefined' && window.pJSDom && window.pJSDom.length > 0) {
        try {
          window.pJSDom.forEach((pJS) => {
            try {
              pJS.pJS?.fn?.vendors?.destroypJS?.();
            } catch {
              /* 忽略单个实例销毁失败 */
            }
          });
        } catch (error) {
          console.error('粒子特效清理失败:', error);
        }
      }
    };
  }, [id, options, colorMode]);

  return (
    <div 
      id={id} 
      ref={particlesRef} 
      className="fixed inset-0 w-full h-full"
      style={{ 
        zIndex: -1,
      }}
    ></div>
  );
};