
const express = require("express");
const bodyParser = require("body-parser");
const trainRoutes = require("./routes/train");
const predictRoutes = require("./routes/predict");

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/train", trainRoutes);
app.use("/predict", predictRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`PPM Prediction API running on port ${PORT}`);
});
