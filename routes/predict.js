const express = require("express");
const router = express.Router();
const { PPMLanguageModel, Vocabulary } = require("../ppm_language_model");

const vocab = new Vocabulary(); // Initialize vocabulary
let model = null; // Model is initialized later when the vocabulary is populated

router.post("/", (req, res) => {
  const { input, level } = req.body;

  if (!input || !level) {
    return res.status(400).json({ error: "Input and level are required." });
  }

  try {
    // Add symbols to the vocabulary
    const symbols = level === "word" ? input.split(" ") : input.split("");
    symbols.forEach((symbol) => vocab.addSymbol(symbol));

    // Initialize the model if it hasn't been initialized yet
    if (!model && vocab.size() > 1) {
      model = new PPMLanguageModel(vocab, 5); // Adjust maxOrder as needed
    }

    if (!model) {
      return res.status(400).json({ error: "Insufficient vocabulary to initialize the model." });
    }

    // Create a new context and process symbols
    const context = model.createContext();
    symbols.forEach((symbol) => {
      const symbolId = vocab.getSymbolOrOOV(symbol);
      model.addSymbolToContext(context, symbolId);
    });

    // Get probabilities and format the response
    const probabilities = model.getProbs(context);
    const predictions = probabilities.map((prob, index) => ({
      symbol: vocab.symbols_[index], // Map IDs back to symbols
      probability: prob,
    }));

    res.status(200).json({
      predictions: predictions.filter((pred) => pred.probability > 0), // Exclude zero-probability predictions
      perplexity: 1 / probabilities.reduce((a, b) => a + b, 0), // Example perplexity calculation
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;