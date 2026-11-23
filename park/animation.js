export function walkCycleFrame(distance, frameCount, strideLength) {
  if (!Number.isFinite(distance) || distance < 0
    || !Number.isInteger(frameCount) || frameCount < 1
    || !Number.isFinite(strideLength) || strideLength <= 0) {
    throw new RangeError('Walk-cycle distance, frame count, and stride length must be valid.');
  }
  return Math.floor((distance % strideLength) / strideLength * frameCount);
}
