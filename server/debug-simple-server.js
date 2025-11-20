const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Simple test server' });
});

const PORT = 3003;

console.log(`🔍 About to start simple server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Test at: http://localhost:${PORT}`);
});