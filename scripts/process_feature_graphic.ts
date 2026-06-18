import { Jimp } from 'jimp';
import * as path from 'path';
import * as fs from 'fs';

async function processGraphic() {
  console.log('Processing feature graphic for Aptoide / Google Play spec (1024x500)...');
  
  const inputPath = path.join(process.cwd(), 'public', 'feature_graphic.png');
  
  if (!fs.existsSync(inputPath)) {
    console.error('Error: public/feature_graphic.png does not exist.');
    process.exit(1);
  }

  // Read the generated feature graphic
  const image = await Jimp.read(inputPath);
  console.log(`Original image size: ${image.width}x${image.height}`);

  // We want to scale and crop to exactly 1024x500 (standard Feature Graphic size)
  // Let's perform a "cover" scale (resize then crop) to make it exactly 1024x500
  // without distorting the aspect ratio.
  const targetWidth = 1024;
  const targetHeight = 500;

  console.log(`Resizing/cropping to exactly ${targetWidth}x${targetHeight}...`);
  
  // Clone and crop/cover
  const processed = image.clone();
  
  // Calculate best scale aspect
  const originalWidth = image.width;
  const originalHeight = image.height;
  
  // Standard coverage logic
  const originalAspect = originalWidth / originalHeight;
  const targetAspect = targetWidth / targetHeight;
  
  let newWidth, newHeight;
  if (originalAspect > targetAspect) {
    // Original is wider than target aspect ratio (needs height-based scale)
    newHeight = targetHeight;
    newWidth = Math.round(targetHeight * originalAspect);
  } else {
    // Original is taller than target aspect ratio (needs width-based scale)
    newWidth = targetWidth;
    newHeight = Math.round(targetWidth / originalAspect);
  }
  
  console.log(`Intermediate scaled size: ${newWidth}x${newHeight}`);
  processed.resize({ w: newWidth, h: newHeight });
  
  // Now crop from the center
  const xOffset = Math.round((newWidth - targetWidth) / 2);
  const yOffset = Math.round((newHeight - targetHeight) / 2);
  
  console.log(`Cropping at offset x: ${xOffset}, y: ${yOffset}`);
  processed.crop({ x: xOffset, y: yOffset, w: targetWidth, h: targetHeight });

  // Save as PNG
  await processed.write(path.join(process.cwd(), 'public', 'feature_graphic_1024x500.png') as `${string}.${string}`);
  console.log('Successfully saved to public/feature_graphic_1024x500.png');

  // Save as JPG (sometimes preferred if PNG is too large or has alpha channels that are incompatible)
  await processed.write(path.join(process.cwd(), 'public', 'feature_graphic_1024x500.jpg') as `${string}.${string}`);
  console.log('Successfully saved to public/feature_graphic_1024x500.jpg');
  
  console.log('Feature graphic processing finished!');
}

processGraphic().catch(err => {
  console.error('Failed to process feature graphic:', err);
  process.exit(1);
});
