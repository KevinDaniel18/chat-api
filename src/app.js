const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));
app.use("/messages", require("./routes/message"));
app.use("/posts", require("./routes/posts"))

module.exports = app;
