import { Jimp } from 'jimp';
import * as fs from 'fs';
import * as path from 'path';

// Define the Coral Peach theme color used in manifest.json (#E57373)
const CORAL_COLOR = (0xE57373FF >>> 0);
const WHITE_COLOR = (0xFFFFFFFF >>> 0);
const TRANSPARENT_COLOR = (0x00000000 >>> 0);

// Returns true if (px, py) is inside the shopping bag handle (semicircle)
function isInsideHandle(px: number, py: number): boolean {
  const cx = 256;
  const cy = 210;
  const outerR = 55;
  const innerR = 43;
  
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  return py <= cy && dist >= innerR && dist <= outerR;
}

// Returns true if (px, py) is inside the bag body (rounded trapezoid)
function isInsideBody(px: number, py: number): boolean {
  const cx = 256;
  const y_top = 205;
  const y_bottom = 365;
  const w_top = 90;
  const w_bottom = 115;
  
  if (py < y_top || py > y_bottom) {
    return false;
  }
  
  // Calculate the half width of the trapezoid at this height
  const halfW = w_top + (py - y_top) * (w_bottom - w_top) / (y_bottom - y_top);
  
  // Bottom rounded corners (radius 25)
  if (py >= 340) {
    const r = 25;
    const cy_b = 340;
    const cx_bl = cx - w_bottom + r; // 256 - 115 + 25 = 166
    const cx_br = cx + w_bottom - r; // 256 + 115 - 25 = 346
    
    if (px < cx_bl) {
      const dx = px - cx_bl;
      const dy = py - cy_b;
      return dx * dx + dy * dy <= r * r;
    }
    if (px > cx_br) {
      const dx = px - cx_br;
      const dy = py - cy_b;
      return dx * dx + dy * dy <= r * r;
    }
    return px >= cx_bl && px <= cx_br;
  }
  
  // Top rounded corners (radius 20)
  if (py <= 225) {
    const r = 20;
    const cy_t = 225;
    const cx_tl = cx - w_top + r; // 256 - 90 + 20 = 186
    const cx_tr = cx + w_top - r; // 256 + 90 - 20 = 326
    
    if (px < cx_tl) {
      const dx = px - cx_tl;
      const dy = py - cy_t;
      return dx * dx + dy * dy <= r * r;
    }
    if (px > cx_tr) {
      const dx = px - cx_tr;
      const dy = py - cy_t;
      return dx * dx + dy * dy <= r * r;
    }
    return px >= cx_tl && px <= cx_tr;
  }
  
  // Middle section
  return px >= (cx - halfW) && px <= (cx + halfW);
}

// Check if a point is inside the shopping bag logo shape
function isInsideLogo(px: number, py: number): boolean {
  return isInsideHandle(px, py) || isInsideBody(px, py);
}

// Evaluates the logo opacity at (x, y) with 3x3 supersampling
function getLogoOpacity(x: number, y: number): number {
  let count = 0;
  const dxt = [-0.33, 0, 0.33];
  const dyt = [-0.33, 0, 0.33];
  
  for (const dx of dxt) {
    for (const dy of dyt) {
      if (isInsideLogo(x + dx, y + dy)) {
        count++;
      }
    }
  }
  return count / 9;
}

// Blend active color over base color
function blendColor(baseColor: number, overlayColor: number, opacity: number): number {
  if (opacity <= 0) return baseColor;
  if (opacity >= 1) return overlayColor;
  
  const rB = (baseColor >>> 24) & 0xFF;
  const gB = (baseColor >>> 16) & 0xFF;
  const bB = (baseColor >>> 8) & 0xFF;
  const aB = baseColor & 0xFF;
  
  const rO = (overlayColor >>> 24) & 0xFF;
  const gO = (overlayColor >>> 16) & 0xFF;
  const bO = (overlayColor >>> 8) & 0xFF;
  const aO = overlayColor & 0xFF;
  
  const aOut = aO * opacity + aB * (1 - opacity);
  if (aOut === 0) return 0;
  
  const rOut = Math.round((rO * aO * opacity + rB * aB * (1 - opacity)) / aOut);
  const gOut = Math.round((gO * aO * opacity + gB * aB * (1 - opacity)) / aOut);
  const bOut = Math.round((bO * aO * opacity + bB * aB * (1 - opacity)) / aOut);
  
  return (((rOut << 24) | (gOut << 16) | (bOut << 8) | Math.round(aOut)) >>> 0);
}

async function main() {
  console.log('Generating premium responsive PWA icons...');
  
  // 1. Generate Circular 512x512 PWA Icon
  const circular512 = new Jimp({ width: 512, height: 512, color: TRANSPARENT_COLOR });
  
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const dx = x - 256;
      const dy = y - 256;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate background color with circle anti-aliasing
      let bg = TRANSPARENT_COLOR;
      if (dist <= 238) {
        bg = CORAL_COLOR;
      } else if (dist <= 241) {
        const bgOpacity = (241 - dist) / 3;
        bg = blendColor(TRANSPARENT_COLOR, CORAL_COLOR, bgOpacity);
      }
      
      // Calculate foreground logo overlay with supersampling
      const logoOpacity = getLogoOpacity(x, y);
      const finalColor = blendColor(bg, WHITE_COLOR, logoOpacity);
      circular512.setPixelColor(finalColor, x, y);
    }
  }
  
  // Save Circular 512x512
  await circular512.write('public/icon-512.png');
  console.log('Saved public/icon-512.png');
  
  // Resize to 192x192
  const circular192 = circular512.clone().resize({ w: 192, h: 192 });
  await circular192.write('public/icon-192.png');
  console.log('Saved public/icon-192.png');
  
  // Resize to 96x96 (For ShortCuts)
  const circular96 = circular512.clone().resize({ w: 96, h: 96 });
  await circular96.write('public/icon-96.png');
  console.log('Saved public/icon-96.png');
  
  // Resize to 114x114 (For Amazon Appstore precise requirement)
  const circular114 = circular512.clone().resize({ w: 114, h: 114 });
  await circular114.write('public/icon-114.png');
  console.log('Saved public/icon-114.png');
  
  // 2. Generate Square Maskable 512x512 Icon
  const maskable512 = new Jimp({ width: 512, height: 512, color: CORAL_COLOR });
  
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const logoOpacity = getLogoOpacity(x, y);
      const finalColor = blendColor(CORAL_COLOR, WHITE_COLOR, logoOpacity);
      maskable512.setPixelColor(finalColor, x, y);
    }
  }
  
  // Resize and save public/icon-192-maskable.png
  const maskable192 = maskable512.clone().resize({ w: 192, h: 192 });
  await maskable192.write('public/icon-192-maskable.png');
  console.log('Saved public/icon-192-maskable.png');
  
  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
