const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const plansRoutes = require("./routes/plansRoutes");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const app = express();

// Load the main Swagger file
const swaggerDocument = YAML.load(
  path.join(__dirname, "docs/swagger/swagger-main.yaml"),
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.set("trust proxy", 1);

const corsOptions = {
  // Allow your frontend domain
  origin: [
    "https://event-bot.chotkari.com",
    "http://localhost:5173",
    "http://localhost:3000",
  ],

  // Allow cookies/sessions to be sent
  credentials: true,

  // Allow these specific methods
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

  // Allowed headers (Standard set usually covers everything)
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // Cache the preflight response for 24 hours (86400 seconds)
  // This reduces the number of OPTIONS requests browsers send
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Serve Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Restaurant API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/plans", plansRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/whatsapp", require("./routes/whatsappRoutes"));
app.use("/api/facebook", require("./routes/facebookRoutes"));
app.use("/api/restaurant", require("./routes/restaurantRoutes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
