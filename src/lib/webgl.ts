// Detect whether the current environment can create a WebGL context.
// Some systems (broken GPU drivers, software rasterizers, sandboxed/headless
// browsers) fail to create a context, which makes `new THREE.WebGLRenderer()`
// throw and — without a guard — crash the whole React tree. Components that
// depend on WebGL must check this first and render a static fallback.
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const attrs: WebGLContextAttributes = { failIfMajorPerformanceCaveat: false };
    const gl = (canvas.getContext("webgl2", attrs) ||
      canvas.getContext("webgl", attrs) ||
      canvas.getContext("experimental-webgl", attrs)) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) return false;
    // Lose the probe context immediately so we don't exhaust the browser's
    // limited context pool.
    const loseContext = gl.getExtension("WEBGL_lose_context");
    if (loseContext) loseContext.loseContext();
    return true;
  } catch {
    return false;
  }
}
