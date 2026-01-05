/**
 * Simple test runner to execute our filter regression tests
 */

// Import test functions
import { runFilterRegressionTests } from './src/tests/FilterComprehensiveTest.js';

// Run the tests
console.log('🏁 Starting Filter Regression Test Suite...\n');

runFilterRegressionTests()
  .then(results => {
    console.log('\n🏁 Test Suite Complete!');
    
    if (results.failed === 0 && results.gorgeFilterWorking) {
      console.log('🎉 ALL TESTS PASSED - Filter functionality is working correctly!');
    } else {
      console.log('⚠️  ISSUES FOUND - Filter functionality needs fixing!');
      
      if (results.failed > 0) {
        console.log(`   ${results.failed} test(s) failed`);
      }
      
      if (!results.gorgeFilterWorking) {
        console.log('   "gorge" filter specifically not working');
      }
    }
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
  });