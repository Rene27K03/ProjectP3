const express = require('express');
const app = express(); // Make sure this line is here

const PORT = process.env.PORT || 3000; // Port for the server

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
