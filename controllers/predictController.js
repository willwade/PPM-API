exports.predict = (req, res) => {
  const { input, level } = req.body;

  if (!input || !level) {
    return res.status(400).send({ error: "Input text and level are required" });
  }

  const { letterModel, wordModel, sentenceModel } = getModels();

  let model;
  switch (level) {
    case "letter":
      model = letterModel;
      break;
    case "word":
      model = wordModel;
      break;
    case "sentence":
      model = sentenceModel;
      break;
    default:
      return res.status(400).send({ error: "Invalid level specified" });
  }

  if (!model) {
    return res.status(400).send({ error: `Model for level "${level}" is not trained yet` });
  }

  try {
    const context = model.createContext();
    const tokens = level === "letter" ? [...input] : input.split(/\s+/);

    tokens.forEach((token) => {
      const tokenId = model.vocab_.getSymbolOrOOV(token);
      model.addSymbolToContext(context, tokenId);
    });

    const probabilities = model.getProbs(context);
    const predictions = model.vocab_.symbols_
      .map((symbol, index) => ({
        symbol,
        probability: probabilities[index],
      }))
      .filter((_, index) => index > 0)
      .sort((a, b) => b.probability - a.probability);

    const perplexity = Math.exp(
      -predictions.reduce((acc, p) => acc + (p.probability > 0 ? p.probability * Math.log(p.probability) : 0), 0)
    );

    res.status(200).send({ predictions, perplexity });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).send({ error: error.message });
  }
};