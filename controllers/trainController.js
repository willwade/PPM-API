const { PPMLanguageModel, Vocabulary } = require("../ppm_language_model");
const fetchData = require("../utils/fetchData");
const crypto = require('crypto');

// Store models per session
const sessionModels = new Map(); // sessionId -> {letterModel, wordModel, sentenceModel, timestamp}

// Default training text
const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog. 
A quick brown dog jumps over the lazy fox. 
The lazy fox sleeps while the quick brown dog watches.`;

// Initialize default models
function initializeDefaultModels() {
  const letterVocab = new Vocabulary();
  const wordVocab = new Vocabulary();
  const sentenceVocab = new Vocabulary();

  // Initialize letter model
  const chars = DEFAULT_TEXT.split("");
  chars.forEach(char => letterVocab.addSymbol(char));
  const letterModel = new PPMLanguageModel(letterVocab, 5);
  const letterContext = letterModel.createContext();
  chars.forEach(char => {
    const symbolId = letterVocab.getSymbolOrOOV(char);
    letterModel.addSymbolAndUpdate(letterContext, symbolId);
  });

  // Initialize word model
  const words = DEFAULT_TEXT.split(/\s+/);
  words.forEach(word => wordVocab.addSymbol(word));
  const wordModel = new PPMLanguageModel(wordVocab, 5);
  const wordContext = wordModel.createContext();
  words.forEach(word => {
    const symbolId = wordVocab.getSymbolOrOOV(word);
    wordModel.addSymbolAndUpdate(wordContext, symbolId);
  });

  // Initialize sentence model
  const sentences = DEFAULT_TEXT.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  sentences.forEach(sentence => sentenceVocab.addSymbol(sentence));
  const sentenceModel = new PPMLanguageModel(sentenceVocab, 3);
  const sentenceContext = sentenceModel.createContext();
  sentences.forEach(sentence => {
    const symbolId = sentenceVocab.getSymbolOrOOV(sentence);
    sentenceModel.addSymbolAndUpdate(sentenceContext, symbolId);
  });

  return {
    letterModel,
    wordModel,
    sentenceModel
  };
}

// Initialize default models
sessionModels.set('default', initializeDefaultModels());

exports.train = async (req, res) => {
  const { url, text, maxOrder = 5 } = req.body;
  const startTime = Date.now();

  try {
    let trainingText;
    if (url) {
      trainingText = await fetchData(url);
    } else if (text) {
      trainingText = text;
    } else {
      return res.status(400).json({ 
        error: "Either url or text must be provided for training",
        success: false
      });
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Create new models for this session
    const letterVocab = new Vocabulary();
    const wordVocab = new Vocabulary();
    const sentenceVocab = new Vocabulary();

    // Train letter model
    const chars = trainingText.split("");
    chars.forEach(char => letterVocab.addSymbol(char));
    const letterModel = new PPMLanguageModel(letterVocab, maxOrder);
    const letterContext = letterModel.createContext();
    chars.forEach(char => {
      const symbolId = letterVocab.getSymbolOrOOV(char);
      letterModel.addSymbolAndUpdate(letterContext, symbolId);
    });

    // Train word model
    const words = trainingText.split(/\s+/);
    words.forEach(word => wordVocab.addSymbol(word));
    const wordModel = new PPMLanguageModel(wordVocab, maxOrder);
    const wordContext = wordModel.createContext();
    words.forEach(word => {
      const symbolId = wordVocab.getSymbolOrOOV(word);
      wordModel.addSymbolAndUpdate(wordContext, symbolId);
    });

    // Train sentence model
    const sentences = trainingText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    sentences.forEach(sentence => sentenceVocab.addSymbol(sentence));
    const sentenceModel = new PPMLanguageModel(sentenceVocab, Math.min(maxOrder, 3));
    const sentenceContext = sentenceModel.createContext();
    sentences.forEach(sentence => {
      const symbolId = sentenceVocab.getSymbolOrOOV(sentence);
      sentenceModel.addSymbolAndUpdate(sentenceContext, symbolId);
    });

    // Store models with timestamp
    sessionModels.set(sessionId, {
      letterModel,
      wordModel,
      sentenceModel,
      timestamp: new Date().toISOString()
    });

    const trainingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      sessionId,
      message: "Training complete",
      trainingTimeMs: trainingTime,
      vocabularySizes: {
        letter: letterVocab.size(),
        word: wordVocab.size(),
        sentence: sentenceVocab.size()
      }
    });

  } catch (error) {
    console.error("Training error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

exports.getModels = (sessionId = 'default') => {
  return sessionModels.get(sessionId) || sessionModels.get('default');
};
