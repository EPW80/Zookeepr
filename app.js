const path = require("path");
const express = require("express");
const apiRoutes = require("./routes/apiRoutes");
const htmlRoutes = require("./routes/htmlRoutes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Use apiRoutes
app.use("/api", apiRoutes);
// Unknown API routes get a JSON 404 instead of falling through to index.html
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use("/", htmlRoutes);

module.exports = app;
