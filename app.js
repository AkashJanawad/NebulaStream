const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// This line tells Express to serve everything in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`NebulaStream running at http://localhost:${port}`);
});
