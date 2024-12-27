
const fetchData = require("../utils/fetchData");
const { PPMLanguageModel } = require("../ppm_language_model");
const vocab = require("../vocabulary");
const { tokenizeText } = require("../utils/tokenizer");

let letterModel, wordModel, sentenceModel; // Models for different levels

exports.train = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send({ error: "URL is required" });
  }

  try {
    const text = await fetchData(url);

    const levels = ["letter", "word", "sentence"];
    const models = {};

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

    letterModel = models.letter;
    wordModel = models.word;
    sentenceModel = models.sentence;

    res.status(200).send({ message: "Training complete for all levels" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.getModels = () => ({ letterModel, wordModel, sentenceModel });
