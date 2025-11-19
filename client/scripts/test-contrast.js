/**
 * Color Contrast Test Script
 * Runs WCAG contrast validation
 */

// Import the contrast checker functions
import { validateAllColorCombinations } from '../src/utils/contrastChecker.js';

console.log('🔍 Running WCAG Color Contrast Tests...\n');

const results = validateAllColorCombinations();

console.log(`📊 Summary:`);
console.log(`   Total tests: ${results.summary.totalTests}`);
console.log(`   WCAG AAA passing: ${results.summary.passingAAA} ✅`);
console.log(`   WCAG AAA failing: ${results.summary.failingAAA} ${results.summary.failingAAA > 0 ? '❌' : '✅'}`);
console.log(`   Average contrast ratio: ${results.summary.averageRatio}:1\n`);

if (results.hasFailures) {
  console.log('❌ Some color combinations fail WCAG AAA compliance:');

  results.details
    .filter(test => !test.passesAAA)
    .forEach(test => {
      console.log(`   ${test.foreground} on ${test.background}: ${test.ratio}:1 (needs 7:1+)`);
    });

  console.log('\n💡 Consider these colors for AAA compliance:');
  console.log('   - neon-green: Excellent (10:1+ ratios)');
  console.log('   - neon-cyan: Excellent (10:1+ ratios)');
  console.log('   - white: Excellent (10:1+ ratios)');
  console.log('   - neon-pink: Good on dark backgrounds (9:1+ ratios)');

  process.exit(1);
} else {
  console.log('✅ All color combinations pass WCAG AAA compliance!');
  console.log('🎉 Your retro gaming theme is accessibility compliant!');
}

process.exit(results.hasFailures ? 1 : 0);