const fs = require("fs");
const path = require("path");
const fetchData = require("../utils/fetchData");
const { PPMLanguageModel } = require("../ppm_language_model");
const vocab = require("../vocabulary");
const { tokenizeText } = require("../utils/tokenizer");

let letterModel, wordModel, sentenceModel; // Models for different levels

exports.train = async (req, res) => {
  const { url } = req.body;

  let text;

  try {
    // If URL is provided, fetch training data from the URL
    if (url) {
      text = await fetchData(url);
    } else {
      // Otherwise, use default training text from a file
      const filePath = path.join(__dirname, "../data/default_training.txt");
      if (!fs.existsSync(filePath)) {
        return res.status(500).send({ error: "Default training text file not found." });
      }
      text = fs.readFileSync(filePath, "utf-8");
    }

    const levels = ["letter", "word", "sentence"];
    const models = {};

    // Train models for each level
    levels.forEach((level) => {
      const { tokens, vocabulary } = tokenizeText(text, level);
      const v = new vocab.Vocabulary();
      vocabulary.forEach((symbol) => v.addSymbol(symbol));

      const model = new PPMLanguageModel(v, 5);
      const context = model.createContext();

      tokens.forEach((token) => {
        const tokenId = v.symbols_.indexOf(token);
        model.addSymbolAndUpdate(context, tokenId);
      });

      models[level] = model;
    });

    // Save trained models to memory
    letterModel = models.letter;
    wordModel = models.word;
    sentenceModel = models.sentence;

    res.status(200).send({ message: "Training complete for all levels" });
  } catch (error) {
    console.error("Error during training:", error);
    res.status(500).send({ error: error.message });
  }
};

exports.getModels = () => ({ letterModel, wordModel, sentenceModel });
