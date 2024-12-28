const { PPMLanguageModel, Vocabulary } = require("../ppm_language_model");
const fetchData = require("../utils/fetchData");
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Store models per session
const sessionModels = new Map(); // sessionId -> {letterModel, wordModel, sentenceModel, timestamp}

// Read the training text file
const DEFAULT_TEXT = fs.readFileSync(
  path.join(__dirname, '../training_text.txt'), 
  'utf8'
);

// Initialize default models
function initializeDefaultModels() {
  console.log("Initializing default models from training_text.txt...");
  const letterVocab = new Vocabulary();
  const wordVocab = new Vocabulary();
  const sentenceVocab = new Vocabulary();

  // Initialize word model
  const words = DEFAULT_TEXT.split(/\s+/);
  words.forEach(word => wordVocab.addSymbol(word));
  const wordModel = new PPMLanguageModel(wordVocab, 5);
  const wordContext = wordModel.createContext();
  words.forEach(word => {
    const symbolId = wordVocab.getSymbolOrOOV(word);
    wordModel.addSymbolAndUpdate(wordContext, symbolId);
  });

  // Initialize letter model
  const letters = DEFAULT_TEXT.split('');
  letters.forEach(letter => letterVocab.addSymbol(letter));
  const letterModel = new PPMLanguageModel(letterVocab, 5);
  const letterContext = letterModel.createContext();
  letters.forEach(letter => {
    const symbolId = letterVocab.getSymbolOrOOV(letter);
    letterModel.addSymbolAndUpdate(letterContext, symbolId);
  });

  // Initialize sentence model
  const sentences = DEFAULT_TEXT.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
  sentences.forEach(sentence => sentenceVocab.addSymbol(sentence));
  const sentenceModel = new PPMLanguageModel(sentenceVocab, 5);
  const sentenceContext = sentenceModel.createContext();
  sentences.forEach(sentence => {
    const symbolId = sentenceVocab.getSymbolOrOOV(sentence);
    sentenceModel.addSymbolAndUpdate(sentenceContext, symbolId);
  });

  const models = {
    letterModel,
    wordModel,
    sentenceModel,
    timestamp: new Date().toISOString()
  };

  console.log("Default models vocabulary sizes:", {
    letter: letterVocab.size(),
    word: wordVocab.size(),
    sentence: sentenceVocab.size()
  });

  return models;
}

// Initialize default models when the server starts
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
  console.log("Getting models for session:", sessionId);
  return sessionModels.get(sessionId) || sessionModels.get('default');
};
