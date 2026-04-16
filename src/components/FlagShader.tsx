import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform sampler2D uTexture;
  uniform float uEdgeSoftness;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 i1 = min(g.xyz, (1.0 - g).zxy);
    vec3 i2 = max(g.xyz, (1.0 - g).zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    vec4 j = p - 49.0 * floor(p * (1.0/49.0));
    vec4 x_ = floor(j * (1.0/7.0));
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * 0.142857142857 + 0.0714285714286;
    vec4 y = y_ * 0.142857142857 + 0.0714285714286;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
      v += amp * snoise(p);
      p *= 2.0; amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 resolution = uResolution;
    float screenAspect = resolution.x / resolution.y;
    float textureAspect = 2.0;
    
    vec2 uv = vUv;
    if (screenAspect > textureAspect) {
      float scale = screenAspect / textureAspect;
      uv.y = (uv.y - 0.5) * scale + 0.5;
    } else {
      float scale = textureAspect / screenAspect;
      uv.x = (uv.x - 0.5) * scale + 0.5;
    }

    float noise = fbm(vec3(uv * 2.0, 0.0)) * 0.5 + 0.5;
    float p = uProgress * 1.5 - 0.5;
    float reveal = smoothstep(p, p - uEdgeSoftness, uv.y - noise * 0.4);
    vec4 tex = texture2D(uTexture, uv);
    
    float alpha = tex.a * reveal;
    gl_FragColor = vec4(tex.rgb, alpha);
  }
`;

interface FlagShaderProps {
  progress?: number;
}

export interface FlagShaderRef {
  updateProgress: (progress: number) => void;
}

interface WebGLResources {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  material: THREE.ShaderMaterial;
  texture: THREE.Texture;
}

export const FlagShader = forwardRef<FlagShaderRef, FlagShaderProps>(({ progress = 0 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const webglRef = useRef<WebGLResources | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useImperativeHandle(ref, () => ({
    updateProgress: (p: number) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uProgress.value = p;
      }
    },
  }));

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress;
    }
  }, [progress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "50px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!webglRef.current) {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const textureLoader = new THREE.TextureLoader();
      const flagTexture = textureLoader.load("/files/walls/ps-grunge-01.png");

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        uniforms: {
          uProgress: { value: progress },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uTexture: { value: flagTexture },
          uEdgeSoftness: { value: 0.45 },
        },
        transparent: true,
        depthWrite: false,
      });
      materialRef.current = material;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      webglRef.current = { renderer, scene, camera, material, texture: flagTexture };

      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        material.uniforms.uResolution.value.set(w, h);
      };
      window.addEventListener("resize", onResize, { passive: true });
    }

    const state = webglRef.current;
    if (!state) return;

    let shouldRender = isVisible;

    const renderLoop = () => {
      if (!shouldRender) {
        frameIdRef.current = null;
        return;
      }
      state.renderer.render(state.scene, state.camera);
      frameIdRef.current = requestAnimationFrame(renderLoop);
    };

    if (isVisible) {
      frameIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      shouldRender = false;
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [isVisible, progress]);

  useEffect(() => {
    return () => {
      const state = webglRef.current;
      if (state) {
        state.renderer.dispose();
        state.material.dispose();
        state.texture.dispose();
        webglRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-4 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full opacity-[0.65] mix-blend-screen" />
    </div>
  );
});
