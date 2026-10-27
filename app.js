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

// Client errors (bad JSON, body too large, unsupported charset, ...) keep
// their 4xx status; anything else is a generic 500.
// Never send stack traces to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    let message = err.expose ? err.message : "Bad request.";
    if (err.type === "entity.parse.failed") {
      message = "Request body is not valid JSON.";
    }
    res.status(status).json({ error: message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

module.exports = app;
