const express = require("express");
const router = express.Router();
const { PPMLanguageModel, Vocabulary } = require("../ppm_language_model");
const { getModels } = require("../controllers/trainController");

// Default training text if no model exists
const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog. 
A quick brown dog jumps over the lazy fox. 
The lazy fox sleeps while the quick brown dog watches.`;

function ensureModelExists(level) {
  const { letterModel, wordModel, sentenceModel } = getModels();
  
  if (level === "letter" && !letterModel) {
    const vocab = new Vocabulary();
    const chars = DEFAULT_TEXT.split("");
    chars.forEach(char => vocab.addSymbol(char));
    const model = new PPMLanguageModel(vocab, 5);
    const context = model.createContext();
    chars.forEach(char => {
      const symbolId = vocab.getSymbolOrOOV(char);
      model.addSymbolAndUpdate(context, symbolId);
    });
    return model;
  }
  
  if (level === "word" && !wordModel) {
    const vocab = new Vocabulary();
    const words = DEFAULT_TEXT.split(/\s+/);
    words.forEach(word => vocab.addSymbol(word));
    const model = new PPMLanguageModel(vocab, 5);
    const context = model.createContext();
    words.forEach(word => {
      const symbolId = vocab.getSymbolOrOOV(word);
      model.addSymbolAndUpdate(context, symbolId);
    });
    return model;
  }

  if (level === "sentence" && !sentenceModel) {
    const vocab = new Vocabulary();
    const sentences = DEFAULT_TEXT.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    sentences.forEach(sentence => vocab.addSymbol(sentence));
    const model = new PPMLanguageModel(vocab, 3); // Lower order for sentences
    const context = model.createContext();
    sentences.forEach(sentence => {
      const symbolId = vocab.getSymbolOrOOV(sentence);
      model.addSymbolAndUpdate(context, symbolId);
    });
    return model;
  }

  return level === "letter" ? letterModel : 
         level === "word" ? wordModel : 
         sentenceModel;
}

router.post("/", (req, res) => {
  const { input, level, numPredictions = 5 } = req.body;

  if (!input || !level) {
    return res.status(400).json({ error: "Input and level are required." });
  }

  try {
    const model = ensureModelExists(level);
    
    if (!model) {
      return res.status(400).json({ 
        error: "No model available. Please train the model first or wait for default initialization." 
      });
    }

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