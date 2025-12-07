// Script simples para criar ícones placeholder PWA
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '../public');

// SVG base - Ícone do clube de poker
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F2314;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1A3A1F;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B8960C;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#D4AF37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${size}" height="${size}" fill="url(#grad1)"/>
  <rect x="${size*0.04}" y="${size*0.04}" width="${size*0.92}" height="${size*0.92}" rx="${size*0.08}" fill="none" stroke="url(#goldGrad)" stroke-width="${size*0.008}" opacity="0.6"/>
  
  <g transform="translate(${size/2}, ${size/2})">
    <path d="M 0,${-size*0.23} C ${-size*0.1},${-size*0.19} ${-size*0.16},${-size*0.12} ${-size*0.16},${-size*0.04} C ${-size*0.16},${size*0.04} ${-size*0.1},${size*0.1} 0,${size*0.1} C ${size*0.1},${size*0.1} ${size*0.16},${size*0.04} ${size*0.16},${-size*0.04} C ${size*0.16},${-size*0.12} ${size*0.1},${-size*0.19} 0,${-size*0.23} Z" 
          fill="url(#goldGrad)" stroke="url(#goldGrad)" stroke-width="${size*0.006}"/>
    <rect x="${-size*0.03}" y="${size*0.08}" width="${size*0.06}" height="${size*0.12}" rx="${size*0.016}" fill="url(#goldGrad)"/>
  </g>
  
  ${size >= 192 ? `
  <text x="${size/2}" y="${size*0.82}" font-family="Arial, sans-serif" font-size="${size*0.09}" font-weight="bold" 
        fill="url(#goldGrad)" text-anchor="middle">ACATH</text>
  <text x="${size/2}" y="${size*0.9}" font-family="Arial, sans-serif" font-size="${size*0.047}" 
        fill="#D4AF37" text-anchor="middle" opacity="0.8">Absolut Poker</text>
  ` : ''}
</svg>
`;

console.log('🎰 Gerando ícones PWA para Absolut Poker Club...\n');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const svgContent = createSVG(size);
  const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
  
  // Salvar SVG (PNG seria necessário converter com sharp ou canvas)
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Criado: ${filename} (SVG temporário)`);
});

console.log('\n🎨 Ícones SVG criados!');
console.log('📝 Para gerar PNG reais, use: npm install sharp');
console.log('   ou converta online: https://cloudconvert.com/svg-to-png\n');

// Criar um favicon simples
const faviconSVG = createSVG(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
console.log('✅ favicon.svg criado!\n');

console.log('🎯 Próximos passos:');
console.log('   1. Converta os SVG para PNG (online ou com sharp)');
console.log('   2. npm run build');
console.log('   3. npm start');
console.log('   4. Abra no celular e instale o PWA! 🎉\n');
