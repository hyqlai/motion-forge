export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
export const lerp = (from: number, to: number, progress: number): number => from + (to - from) * progress;
export const tween = (
  time: number,
  start: number,
  duration: number,
  ease: (progress: number) => number,
): number => ease(clamp01((time - start) / duration));

export const power1In = (value: number): number => value ** 2;
export const power1Out = (value: number): number => 1 - (1 - value) ** 2;
export const power2Out = (value: number): number => 1 - (1 - value) ** 3;
export const power3Out = (value: number): number => 1 - (1 - value) ** 4;
export const power2In = (value: number): number => value ** 3;
export const power1InOut = (value: number): number => value < 0.5
  ? 2 * value * value
  : 1 - (-2 * value + 2) ** 2 / 2;
export const power2InOut = (value: number): number => value < 0.5
  ? 4 * value ** 3
  : 1 - (-2 * value + 2) ** 3 / 2;
export const sineIn = (value: number): number => 1 - Math.cos((value * Math.PI) / 2);
export const sineOut = (value: number): number => Math.sin((value * Math.PI) / 2);
export const sineInOut = (value: number): number => -(Math.cos(Math.PI * value) - 1) / 2;
export const power3InOut = (value: number): number => value < 0.5
  ? 8 * value ** 4
  : 1 - (-2 * value + 2) ** 4 / 2;
export const power3In = (value: number): number => value ** 4;
export const power4In = (value: number): number => value ** 5;
export const power4Out = (value: number): number => 1 - (1 - value) ** 5;
export const power4InOut = (value: number): number => value < 0.5
  ? 16 * value ** 5
  : 1 - (-2 * value + 2) ** 5 / 2;
export const linear = (value: number): number => value;
// 运镜专用缓动：匀速 + 前载减速，末速 = r × 平均速（非零，hold 期能无缝续走，镜头不停死）
export const camEase = (endRate: number) => (value: number): number =>
  value + (1 - endRate) * value * value * (1 - value);
// cubic-bezier 缓动：解 x(t)=p 再取 y(t)（牛顿迭代），用于来源卡的专用曲线
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (progress: number): number => {
    let u = progress;
    for (let i = 0; i < 8; i++) {
      const error = ((ax * u + bx) * u + cx) * u - progress;
      if (Math.abs(error) < 1e-6) break;
      const derivative = (3 * ax * u + 2 * bx) * u + cx;
      if (Math.abs(derivative) < 1e-6) break;
      u -= error / derivative;
    }
    u = clamp01(u);
    return ((ay * u + by) * u + cy) * u;
  };
};
export const backOut = (strength = 1.70158) => (value: number): number => {
  const shifted = value - 1;
  return 1 + (strength + 1) * shifted ** 3 + strength * shifted ** 2;
};
