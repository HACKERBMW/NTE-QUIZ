const fs = require('fs');
const { createCanvas } = require('canvas');

// Generate a simple icon with the emoji
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#FFE4E1';
  ctx.fillRect(0, 0, size, size);
  
  // Draw rounded rectangle
  ctx.fillStyle = '#FFE4E1';
  ctx.beginPath();
  const radius = size * 0.2;
  ctx.moveTo(size, size - radius);
  ctx.arcTo(size, size, size - radius, size, radius);
  ctx.lineTo(radius, size);
  ctx.arcTo(0, size, 0, size - radius, radius);
  ctx.lineTo(0, radius);
  ctx.arcTo(0, 0, radius, 0, radius);
  ctx.lineTo(size - radius, 0);
  ctx.arcTo(size, 0, size, radius, radius);
  ctx.closePath();
  ctx.fill();
  
  // Add emoji
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚓', size / 2, size / 2);
  
  return canvas.toBuffer();
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('./icons')) {
  fs.mkdirSync('./icons');
}

// Generate icons in different sizes
const sizes = [192, 512];
sizes.forEach(size => {
  const iconBuffer = generateIcon(size);
  fs.writeFileSync(`./icons/icon-${size}x${size}.png`, iconBuffer);
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('Icon generation complete!'); 