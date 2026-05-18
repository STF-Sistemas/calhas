const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'logo.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');

fs.mkdirSync(outDir, { recursive: true });

// SVG com viewBox explícito para garantir renderização correta
const svgContent = fs.readFileSync(svgPath, 'utf8');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  });
  const rendered = resvg.render();
  const pngBuffer = rendered.asPng();
  const outFile = path.join(outDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outFile, pngBuffer);
  console.log(`✓ ${outFile} (${pngBuffer.length} bytes)`);
}

console.log('\nÍcones gerados com sucesso!');
