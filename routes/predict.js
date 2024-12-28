const express = require("express");
const router = express.Router();
const { PPMLanguageModel, Vocabulary } = require("../ppm_language_model");
const { getModels } = require("../controllers/trainController");

function ensureModelExists(level) {
  return getModels()[level === "letter" ? "letterModel" : 
                     level === "word" ? "wordModel" : 
                     "sentenceModel"];
}

router.post("/", (req, res) => {
  const { input, level, numPredictions = 5 } = req.body;
  const sessionId = req.headers['x-session-id'] || 'default';

  console.log("Predict request:", { input, level, sessionId });

  if (!input || !level) {
    return res.status(400).json({ error: "Input and level are required." });
  }

  try {
    // Get models specific to this session
    const models = getModels(sessionId);
    console.log("Retrieved models:", { 
      hasLetterModel: !!models?.letterModel,
      hasWordModel: !!models?.wordModel,
      hasSentenceModel: !!models?.sentenceModel
    });

    // Get the appropriate model for the requested level
    const model = level === "letter" ? models.letterModel :
                 level === "word" ? models.wordModel :
                 models.sentenceModel;

    if (!model) {
      console.log("No model found for level:", level);
      return res.status(400).json({ 
        error: `No ${level} model available for this session.` 
      });
    }

    // Log vocabulary size
    console.log("Model vocabulary size:", model.vocab_.size());

    // Create a new context and process input
    const context = model.createContext();
    const symbols = level === "word" ? input.split(/\s+/) : input.split("");
    
    symbols.forEach(symbol => {
      const symbolId = model.vocab_.getSymbolOrOOV(symbol);
      model.addSymbolToContext(context, symbolId);
    });

    // Get probabilities and format predictions
    const probabilities = model.getProbs(context);
    const predictions = probabilities
      .map((prob, index) => ({
        symbol: model.vocab_.symbols_[index],
        probability: prob
      }))
      // Remove root symbol and any invalid symbols
      .filter(pred => pred.symbol !== "<R>" && pred.symbol !== "<OOV>")
      // Sort by probability (highest first)
      .sort((a, b) => b.probability - a.probability)
      // Take top N predictions, even if probability is 0
      .slice(0, numPredictions)
      // Add log probability for each prediction
      .map(pred => ({
        ...pred,
        logProbability: pred.probability > 0 ? Math.log(pred.probability) : -Infinity
      }));

    res.status(200).json({
      input,
      level,
      predictions,
      contextOrder: context.order_,
      perplexity: predictions.some(p => p.probability > 0) ? 
        1 / predictions.reduce((sum, p) => sum + p.probability, 0) : 
        null
    });

  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;