const express = require("express");
const app = express();

// מגיש את כל הקבצים הסטטיים
app.use(express.static("."));

// מאזין לפורט של Vercel
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});
