# Real AI Butterfly Effect Tests

These tests use the actual OpenAI API instead of mocks to validate the complete AI → Consequence → Butterfly Effect flow.

## Setup Required

### 1. Environment Variables

Create a `.env` file in the server directory with:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Optional: Test Configuration
TEST_OPENAI_ENABLED=true
```

### 2. API Key Setup

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Add it to your environment variables or `.env` file
3. Ensure the key has sufficient credits for testing

### 3. Install Dependencies

```bash
cd server
npm install
```

## Running the Tests

### Run All Tests (including mocks)
```bash
npm test
```

### Run Only Real AI Tests
```bash
npm test -- --testPathPatterns=RealAIButterflyEffect
```

### Skip Real AI Tests (if no API key)
```bash
TEST_OPENAI_ENABLED=false npm test -- --testPathPatterns=RealAIButterflyEffect
```

## What These Tests Do

### Real AI → Butterfly Effect Flow
1. **Player Action**: Real player input (e.g., "I want to defeat the ancient dragon")
2. **AI Processing**: Calls actual OpenAI GPT-3.5-turbo
3. **Consequence Generation**: Parses AI response into structured game consequences
4. **Butterfly Effects**: Creates cascading effects and visual data
5. **Persistence**: Stores effects in game world state
6. **Performance Validation**: Ensures <15 second processing time

### Test Cases
- **Dragon Defeat**: Tests combat consequences and village relationships
- **Magical Discovery**: Tests exploration and character progression
- **Trade Negotiation**: Tests economic and social systems

### Expected Results
- ✅ AI generates realistic, contextual responses
- ✅ Consequences are properly structured and validated
- ✅ Butterfly effects create cascading networks
- ✅ Visual data is generated for frontend consumption
- ✅ Effects persist in game state
- ✅ Performance meets 15-second requirement

## Example Output

```
🤖 Testing AI: I want to defeat the ancient dragon that has been terrorizing the village
✅ AI Response received in 1234ms
📝 AI Response: As you strike the final blow against the ancient dragon, a thunderous roar echoes through the valley...
🎯 Generated 3 consequences in 45ms
   1. relationship: Village elders reward you with honorary citizenship...
   2. economic: Dragon's treasure horde creates wealth surge...
   3. environment: Forest begins to heal from dragon's corruption...
🦋 Created butterfly effects in 23ms
   Total nodes: 31
   Total connections: 28
   Emergent opportunities: 2
💾 Persisted butterfly effects in 12ms
⏱️  Total processing time: 1314ms
   - AI Processing: 1234ms
   - Consequence Generation: 45ms
   - Butterfly Effects: 23ms
   - Persistence: 12ms
🎯 Successfully processed: Dragon Defeat
```

## Cost Considerations

These tests use real OpenAI API calls and will incur costs:
- Each test uses ~200-500 tokens
- With GPT-3.5-turbo, costs are minimal (~$0.0004 per test)
- Full test suite costs ~$0.002 total

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY not found"**
   - Set up your `.env` file with a valid OpenAI API key
   - Ensure the key starts with `sk-`

2. **"Insufficient credits"**
   - Check your OpenAI account balance
   - Add credits to your account

3. **"API rate limit exceeded"**
   - Tests include rate limiting and retry logic
   - Wait a few minutes and try again

4. **"Network timeout"**
   - Tests have 30-second timeout per AI request
   - Check your internet connection

### Debug Mode

Set `DEBUG=true` in your environment to see detailed logs:

```bash
DEBUG=true npm test -- --testPathPatterns=RealAIButterflyEffect
```

## Next Steps

Once these tests pass, you can be confident that:
- Real AI responses work with your butterfly effect system
- Performance requirements are met with actual AI processing
- The complete AI → game world integration is functional
- Your system is ready for production with real OpenAI integration