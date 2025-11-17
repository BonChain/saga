/**
 * WCAG Contrast Checker
 * Validates that color combinations meet WCAG 2.1 AAA requirements
 */

function getLuminance(color) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function validateContrast(foreground, background, requirement = 'AAA') {
  const ratio = getContrastRatio(foreground, background);

  const thresholds = {
    'AA-normal': 4.5,
    'AA-large': 3.0,
    'AAA-normal': 7.0,
    'AAA-large': 4.5
  };

  const result = {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= thresholds['AA-normal'],
    passesAALarge: ratio >= thresholds['AA-large'],
    passesAAA: ratio >= thresholds['AAA-normal'],
    passesAAALarge: ratio >= thresholds['AAA-large']
  };

  return result;
}

// Test our color scheme
const colors = {
  neonGreen: '#00ff41',
  neonCyan: '#00ffff',
  neonPink: '#ff33cc', // Updated brighter pink
  neonYellow: '#ffaa00',
  neonRed: '#ff4141',
  terminalBlack: '#0a0a0a',
  terminalDark: '#1a1a1a',
  terminalMedium: '#2d2d2d',
  white: '#ffffff'
};

console.log('=== WCAG Contrast Validation ===\n');

const tests = [
  { name: 'Green on Black', fg: colors.neonGreen, bg: colors.terminalBlack },
  { name: 'Cyan on Black', fg: colors.neonCyan, bg: colors.terminalBlack },
  { name: 'Pink on Black', fg: colors.neonPink, bg: colors.terminalBlack },
  { name: 'Yellow on Black', fg: colors.neonYellow, bg: colors.terminalBlack },
  { name: 'White on Dark', fg: colors.white, bg: colors.terminalDark },
  { name: 'Green on Dark', fg: colors.neonGreen, bg: colors.terminalDark },
  { name: 'Cyan on Dark', fg: colors.neonCyan, bg: colors.terminalDark },
  { name: 'Pink on Dark', fg: colors.neonPink, bg: colors.terminalDark }
];

tests.forEach(test => {
  const result = validateContrast(test.fg, test.bg);
  console.log(`${test.name}:`);
  console.log(`  Contrast Ratio: ${result.ratio}:1`);
  console.log(`  WCAG AA Normal: ${result.passesAA ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  WCAG AA Large: ${result.passesAALarge ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  WCAG AAA Normal: ${result.passesAAA ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  WCAG AAA Large: ${result.passesAAALarge ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

export { validateContrast, getContrastRatio };