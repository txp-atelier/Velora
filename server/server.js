require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const productsRouter = require("./routes/products");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const reviewsRouter = require("./routes/reviews");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5172";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Velora API is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/upload", uploadRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      const env = process.env.NODE_ENV || "development";
      console.log(`Velora server running on http://localhost:${PORT} [${env}]`);
      console.log(`CORS allowed origin: ${CLIENT_URL}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
