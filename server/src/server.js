import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
