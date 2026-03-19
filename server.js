const express = require("express");
const app = express();

// מגיש את כל הקבצים הסטטיים (HTML, CSS, JS)
app.use(express.static("."));

// מאזין על הפורט של Vercel
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});
