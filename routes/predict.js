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
  const { input, level, numPredictions = 5, mode = 'next' } = req.body;
  const sessionId = req.headers['x-session-id'] || 'default';

  console.log("Predict request:", { input, level, mode, sessionId });

  if (!input || !level) {
    return res.status(400).json({ error: "Input and level are required." });
  }

  try {
    const models = getModels(sessionId);
    const model = level === "letter" ? models.letterModel :
                 level === "word" ? models.wordModel :
                 models.sentenceModel;

    if (!model) {
      console.log("No model found for level:", level);
      return res.status(400).json({ 
        error: `No ${level} model available for this session.` 
      });
    }

    // Split input based on level and mode
    let symbols;
    let filteredVocab = [...model.vocab_.symbols_]; // Create a copy of the vocabulary

    if (level === "word") {
      const words = input.split(/\s+/);
      const lastWord = words[words.length - 1];
      
      if (mode === 'complete' || mode === 'current') {
        // For word completion, we want to match partial words
        symbols = words.slice(0, -1);
        // Filter vocabulary to only include words that start with the partial word
        filteredVocab = model.vocab_.symbols_
          .filter(word => 
            word.toLowerCase().startsWith(lastWord.toLowerCase())
          );
        console.log(`Found ${filteredVocab.length} words starting with "${lastWord}"`);
      } else { // mode === 'next'
        // For next word prediction, use all complete words
        symbols = words;
      }
    } else {
      symbols = input.split("");
    }

    // Create context and get predictions
    const context = model.createContext();
    symbols.forEach(symbol => {
      const symbolId = model.vocab_.getSymbolOrOOV(symbol);
      model.addSymbolToContext(context, symbolId);
    });

    // Get probabilities and format predictions
    const probabilities = model.getProbs(context);
    let predictions = probabilities
      .map((prob, index) => ({
        symbol: model.vocab_.symbols_[index],
        probability: prob
      }));

    // If we're in complete/current mode, filter predictions to only include matching words
    if (level === "word" && (mode === 'complete' || mode === 'current')) {
      predictions = predictions
        .filter(pred => filteredVocab.includes(pred.symbol));
    }

    predictions = predictions
      .filter(pred => pred.symbol !== "<R>" && pred.symbol !== "<OOV>")
      .sort((a, b) => b.probability - a.probability)
      .slice(0, numPredictions)
      .map(pred => ({
        ...pred,
        logProbability: pred.probability > 0 ? Math.log(pred.probability) : -Infinity
      }));

    res.status(200).json({
      input,
      level,
      mode,
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