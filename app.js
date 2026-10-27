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

// Malformed request bodies get a 400; anything else a generic 500.
// Never send stack traces to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Request body is not valid JSON." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

module.exports = app;
