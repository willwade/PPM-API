
module.exports.tokenizeText = (text, level) => {
  let tokens, vocabulary;

  switch (level) {
    case "letter":
      tokens = [...text];
      vocabulary = new Set(tokens);
      break;
    case "word":
      tokens = text.split(/\s+/);
      vocabulary = new Set(tokens);
      break;
    case "sentence":
      tokens = text.split(/[.!?]+/).map((s) => s.trim());
      vocabulary = new Set(tokens);
      break;
    default:
      throw new Error("Invalid level specified");
  }

  return { tokens, vocabulary };
};
