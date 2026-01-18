import { useEffect, useRef } from 'react';
import { useColorMode } from '../utils/darkModeUtils';

// 声明全局粒子JS对象
declare global {
  interface Window {
    particlesJS: any;
    pJSDom: any[];
    Stats: any;
  }
}

interface ParticlesProps {
  id?: string;
  options?: any;
}

export const Particles = ({ id = 'particles-js', options }: ParticlesProps) => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const colorMode = useColorMode();

  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined' && particlesRef.current && window.particlesJS) {
      // 根据主题确定粒子颜色
      const particleColor = colorMode === 'dark' ? '#ffffff' : '#333333';
      
      // 默认配置 - 移除了无法访问的背景图片
      const defaultOptions = {
        "particles": {
          "number": {
            "value": 80,
            "density": {
              "enable": true,
              "value_area": 800
            }
          },
          "color": {
            "value": particleColor
          },
          "shape": {
            "type": "star",
            "stroke": {
              "width": 0,
              "color": particleColor
            },
            "polygon": {
              "nb_sides": 5
            }
          },
          "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
              "enable": false,
              "speed": 1,
              "opacity_min": 0.1,
              "sync": false
            }
          },
          "size": {
            "value": 4,
            "random": true,
            "anim": {
              "enable": false,
              "speed": 40,
              "size_min": 0.1,
              "sync": false
            }
          },
          "line_linked": {
            "enable": true,
            "distance": 150,
            "color": particleColor,
            "opacity": 0.4,
            "width": 1
          },
          "move": {
            "enable": true,
            "speed": 6,
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
              "enable": false,
              "rotateX": 600,
              "rotateY": 1200
            }
          }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": {
            "onhover": {
              "enable": false,
              "mode": "grab"
            },
            "onclick": {
              "enable": true,
              "mode": "repulse"
            },
            "resize": true
          },
          "modes": {
            "grab": {
              "distance": 200,
              "line_linked": {
                "opacity": 1
              }
            },
            "bubble": {
              "distance": 400,
              "size": 40,
              "duration": 2,
              "opacity": 8,
              "speed": 3
            },
            "repulse": {
              "distance": 200,
              "duration": 0.4
            },
            "push": {
              "particles_nb": 4
            },
            "remove": {
              "particles_nb": 2
            }
          }
        },
        "retina_detect": true
      };

      try {
        // 清理旧的粒子特效
        if (window.pJSDom && window.pJSDom.length > 0) {
          window.pJSDom.forEach((pJS: any) => {
            if (pJS.pJS && pJS.pJS.fn && pJS.pJS.fn.vendors && pJS.pJS.fn.vendors.destroy) {
              pJS.pJS.fn.vendors.destroy();
            }
          });
        }
        
        // 初始化粒子特效
        window.particlesJS(id, options || defaultOptions);
      } catch (error) {
        console.error('粒子特效初始化失败:', error);
      }
    }

    // 清理函数
    return () => {
      // 检查是否在浏览器环境中
      if (typeof window !== 'undefined' && window.pJSDom && window.pJSDom.length > 0) {
        try {
          window.pJSDom.forEach((pJS: any) => {
            if (pJS.pJS && pJS.pJS.fn && pJS.pJS.fn.vendors && pJS.pJS.fn.vendors.destroy) {
              pJS.pJS.fn.vendors.destroy();
            }
          });
        } catch (error) {
          console.error('粒子特效清理失败:', error);
        }
      }
    };
  }, [id, options, colorMode]);

  return (
    <div id={id} ref={particlesRef} className="fixed top-0 left-0 w-full h-full -z-10"></div>
  );
};