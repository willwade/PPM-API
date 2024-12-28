const express = require("express");
const bodyParser = require("body-parser");
const trainRoutes = require("./routes/train");
const predictRoutes = require("./routes/predict");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json"); // Adjust the path if needed

const app = express();
app.use(bodyParser.json());

// Modify swagger host based on environment
if (process.env.NODE_ENV === 'production') {
  swaggerDocument.host = 'ppmpredictor.openassistive.org';
  swaggerDocument.schemes = ['http', 'https'];
} else {
  swaggerDocument.host = 'localhost:8080';
  swaggerDocument.schemes = ['http'];
}

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/train", trainRoutes);
app.use("/predict", predictRoutes);

// Health Check Endpoint
app.get("/", (req, res) => {
  res.status(200).send("PPM Prediction API is running.");
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PPM Prediction API running on port ${PORT}`);
});
