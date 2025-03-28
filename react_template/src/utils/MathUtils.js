// src/utils/MathUtils.js

/**
 * Generates a seeded random number generator function
 * @param {number} seed - The seed value for random generation
 * @returns {function} A function that returns seeded random numbers between 0 and 1
 */
export function generateSeededRandom(seed) {
  // Simple xorshift algorithm for pseudo-random number generation
  let xorshift = seed || 1;

  return function() {
    // XORShift algorithm
    xorshift ^= xorshift << 13;
    xorshift ^= xorshift >> 17;
    xorshift ^= xorshift << 5;

    // Normalize to 0-1 range
    return Math.abs(xorshift) / 2147483647;
  };
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} The interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Maps a value from one range to another
 * @param {number} value - The value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} The mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculates the distance between two 3D points
 * @param {Object} point1 - Point with x, y, z coordinates
 * @param {Object} point2 - Point with x, y, z coordinates
 * @returns {number} The distance between the points
 */
export function distance3D(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} A random integer
 */
export function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculates a smooth step between two values
 * @param {number} edge0 - The lower edge
 * @param {number} edge1 - The upper edge
 * @param {number} x - The input value
 * @returns {number} The smoothed value
 */
export function smoothStep(edge0, edge1, x) {
  // Scale, bias and saturate x to 0..1 range
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  // Evaluate polynomial
  return x * x * (3 - 2 * x);
}

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Generates a noise value using a simple value noise algorithm
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {function} randFn - Random number generator function
 * @returns {number} Noise value between 0 and 1
 */
export function simpleNoise3D(x, y, z, randFn = Math.random) {
  // Simple implementation of Value Noise
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  
  // Using the coordinates to generate a seed for each grid point
  const getValue = (xp, yp, zp) => {
    // Simple hash function to get a value from coordinates
    const seed = (xp * 3761 + yp * 4177 + zp * 5227) % 1000;
    return randFn(seed);
  };
  
  // Get values for the 8 corners of the cube
  const v000 = getValue(xi, yi, zi);
  const v001 = getValue(xi, yi, zi + 1);
  const v010 = getValue(xi, yi + 1, zi);
  const v011 = getValue(xi, yi + 1, zi + 1);
  const v100 = getValue(xi + 1, yi, zi);
  const v101 = getValue(xi + 1, yi, zi + 1);
  const v110 = getValue(xi + 1, yi + 1, zi);
  const v111 = getValue(xi + 1, yi + 1, zi + 1);
  
  // Smoothed factors for interpolation
  const sx = smoothStep(0, 1, xf);
  const sy = smoothStep(0, 1, yf);
  const sz = smoothStep(0, 1, zf);
  
  // Interpolate along x
  const nx00 = lerp(v000, v100, sx);
  const nx01 = lerp(v001, v101, sx);
  const nx10 = lerp(v010, v110, sx);
  const nx11 = lerp(v011, v111, sx);
  
  // Interpolate along y
  const nxy0 = lerp(nx00, nx10, sy);
  const nxy1 = lerp(nx01, nx11, sy);
  
  // Final interpolation along z
  return lerp(nxy0, nxy1, sz);
}

export default {
  generateSeededRandom,
  lerp,
  clamp,
  mapRange,
  distance3D,
  randomInt,
  smoothStep,
  degToRad,
  radToDeg,
  simpleNoise3D
};
