// Quick test script for routing decision display functionality
import { createShowRoutingDecisionTool } from './src/tools/show-routing-decision/tools.js';
import { route_sisyphus } from './src/tools/route-sisyphus/tools.js';

async function testRoutingDecision() {
  console.log('🧪 Testing Sisyphus Routing Decision Display\n');

  // Test 1: Simple query routing
  console.log('Test 1: Simple query ("What is 2+2?")');
  try {
    const simpleResult = await route_sisyphus.execute({ query: "What is 2+2?" });
    console.log('Router result:', simpleResult);
    console.log('✅ Simple query routing successful\n');
  } catch (error) {
    console.log('❌ Simple query routing failed:', error.message, '\n');
  }

  // Test 2: Complex query routing
  console.log('Test 2: Complex query ("Implement full-stack authentication system")');
  try {
    const complexResult = await route_sisyphus.execute({ query: "Implement full-stack authentication system with JWT, database integration, and role-based access control" });
    console.log('Router result:', complexResult);
    console.log('✅ Complex query routing successful\n');
  } catch (error) {
    console.log('❌ Complex query routing failed:', error.message, '\n');
  }

  // Test 3: Manual tool test
  console.log('Test 3: Manual routing decision tool');
  try {
    const tool = createShowRoutingDecisionTool();
    const toolResult = await tool.execute({ query: "Create a React component with TypeScript" }, {});
    console.log('Tool result:');
    console.log(toolResult);
    console.log('✅ Manual tool test successful\n');
  } catch (error) {
    console.log('❌ Manual tool test failed:', error.message, '\n');
  }

  console.log('🎯 All routing tests completed!');
}

testRoutingDecision().catch(console.error);