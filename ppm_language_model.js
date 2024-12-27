
const assert = require("assert");

class Vocabulary {
  constructor() {
    this.symbols_ = ["<R>"]; // Predefine root symbol
    this.symbolMap_ = new Map();
    this.symbolMap_.set("<R>", 0);
    this.oovSymbol = "<OOV>";
    this.oovID = -1; // Will be assigned when first used
  }

  /**
   * Adds a symbol to the vocabulary, returning its unique ID.
   * @param {string} symbol Symbol to be added.
   * @return {number} Symbol ID.
   */
  addSymbol(symbol) {
    if (this.symbolMap_.has(symbol)) {
      return this.symbolMap_.get(symbol);
    }
    const id = this.symbols_.length;
    this.symbolMap_.set(symbol, id);
    this.symbols_.push(symbol);
    return id;
  }

  /**
   * Gets the ID of a symbol, or maps to OOV if not found.
   * @param {string} symbol Symbol to look up.
   * @return {number} Symbol ID.
   */
  getSymbolOrOOV(symbol) {
    if (this.symbolMap_.has(symbol)) {
      return this.symbolMap_.get(symbol);
    }
    if (this.oovID === -1) {
      this.oovID = this.addSymbol(this.oovSymbol);
    }
    return this.oovID;
  }

  /**
   * Returns the size of the vocabulary, including the root symbol.
   * @return {number} Size.
   */
  size() {
    return this.symbols_.length;
  }
}


class Node {
  constructor() {
    this.child_ = null;
    this.next_ = null;
    this.backoff_ = null;
    this.count_ = 1;
    this.symbol_ = 0; // root symbol
  }

  findChildWithSymbol(symbol) {
    let current = this.child_;
    while (current != null) {
      if (current.symbol_ == symbol) {
        return current;
      }
      current = current.next_;
    }
    return null;
  }

  totalChildrenCounts(exclusionMask) {
    let childNode = this.child_;
    let count = 0;
    while (childNode != null) {
      if (!exclusionMask || !exclusionMask[childNode.symbol_]) {
        count += childNode.count_;
      }
      childNode = childNode.next_;
    }
    return count;
  }
}

class Context {
  constructor(head, order) {
    this.head_ = head;
    this.order_ = order;
  }
}

class PPMLanguageModel {
  constructor(vocab, maxOrder) {
    this.vocab_ = vocab;
    assert(this.vocab_.size() > 1, "Expecting at least two symbols in the vocabulary");

    this.maxOrder_ = maxOrder;
    this.root_ = new Node();
    this.rootContext_ = new Context(this.root_, 0);
    this.numNodes_ = 1;

    this.useExclusion_ = false;
  }

  addSymbolToContext(context, symbol) {
  if (symbol <= 0) return;

  assert(symbol < this.vocab_.size(), `Invalid symbol: ${symbol}`);
  
  while (context.head_ !== null) {
    const symbolNode = context.head_.findChildWithSymbol(symbol);

    if (symbolNode) {
      context.head_ = symbolNode;
      context.order_++;
      return;
    } else {
      // Fallback to the backoff context
      context.head_ = context.head_.backoff_;
      context.order_ = Math.max(0, context.order_ - 1);
    }
  }

  // If context.head_ is null, reset to root
  if (context.head_ === null) {
    context.head_ = this.root_;
    context.order_ = 0;
  }
}

  addSymbolToNode_(node, symbol) {
    let symbolNode = node.findChildWithSymbol(symbol);
    if (symbolNode != null) {
      symbolNode.count_++;
    } else {
      symbolNode = new Node();
      symbolNode.symbol_ = symbol;
      symbolNode.next_ = node.child_;
      node.child_ = symbolNode;
      this.numNodes_++;
      if (node == this.root_) {
        symbolNode.backoff_ = this.root_;
      } else {
        assert(node.backoff_ != null, "Expected valid backoff node");
        symbolNode.backoff_ = this.addSymbolToNode_(node.backoff_, symbol);
      }
    }
    return symbolNode;
  }

  createContext() {
    return new Context(this.rootContext_.head_, this.rootContext_.order_);
  }

  addSymbolAndUpdate(context, symbol) {
    if (symbol <= 0) return;

    assert(symbol < this.vocab_.size(), "Invalid symbol: " + symbol);
    const symbolNode = this.addSymbolToNode_(context.head_, symbol);
    assert(symbolNode == context.head_.findChildWithSymbol(symbol));
    context.head_ = symbolNode;
    context.order_++;
    while (context.order_ > this.maxOrder_) {
      context.head_ = context.head_.backoff_;
      context.order_--;
    }
  }

  getProbs(context) {
    const numSymbols = this.vocab_.size();
    let probs = new Array(numSymbols).fill(0.0);
    let totalMass = 1.0;
    let node = context.head_;
    let gamma = totalMass;

    while (node != null) {
      const count = node.totalChildrenCounts(null);
      if (count > 0) {
        let childNode = node.child_;
        while (childNode != null) {
          const symbol = childNode.symbol_;
          const p = gamma * childNode.count_ / count;
          probs[symbol] += p;
          totalMass -= p;
          childNode = childNode.next_;
        }
      }
      node = node.backoff_;
      gamma = totalMass;
    }

    return probs;
  }
}

module.exports = { PPMLanguageModel, Vocabulary };
