# PPM Prediction API

A text prediction API using Prediction by Partial Matching (PPM). Train on any text to create personalized predictions, or use the default English training text.

## Features
- Train on any text of your choice
- Session-based models for individual customization
- Predict at letter, word, or sentence level
- Falls back to default English training if no custom training provided

## Setup

### Prerequisites
- Node.js (>=20.0.0)
- npm (>=9.0.0)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/willwade/PPM-API.git
   cd PPM-API
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Install Python dependencies for generating training text:
   ```bash
   pip install datasets
   ```

### Usage

#### Start the API
Run the following command to start the API:
```bash
npm start
```

The API will be available at `http://localhost:8080`.


## API Documentation

Once running, view the full API documentation at:
```
http://localhost:8080/api-docs
```

### Quick Start Guide

1. **Train a Model** (Optional)

```bash
curl -X POST http://localhost:8080/train \
-H "Content-Type: application/json" \
-d '{
"url": "https://www.gutenberg.org/cache/epub/19778/pg19778.txt",
"maxOrder": 5
}'
```

Response:

```json
{
"success": true,
"sessionId": "550e8400-e29b-41d4-a716-446655440000",
"message": "Training complete",
"trainingTimeMs": 1234,
"vocabularySizes": {
"letter": 52,
"word": 2000,
"sentence": 500
}
}
```

2. **Make Predictions**

```bash
curl -X POST http://localhost:8080/predict \
-H "Content-Type: application/json" \
-H "x-session-id: 550e8400-e29b-41d4-a716-446655440000" \
-d '{
"input": "The quick brown",
"level": "word",
"numPredictions": 5
}'
```

Response:

```json
json
{
"input": "The quick brown",
"level": "word",
"predictions": [
{
"symbol": "fox",
"probability": 0.4,
"logProbability": -0.916
},
// ... more predictions
],
"contextOrder": 3,
"perplexity": 2.5
}
```

### Training Options

You can train the model in two ways:

1. **Using a URL**:

```json
{
"url": "https://www.gutenberg.org/cache/epub/19778/pg19778.txt",
"maxOrder": 5
}
```

2. **Using Direct Text**:

```json
{
"text": "Your training text here",
"maxOrder": 5
}
```

Note: Provide either `url` OR `text`, but not both.

### Prediction Levels

The API supports three prediction levels:
- `letter`: Character-by-character prediction
- `word`: Word-by-word prediction
- `sentence`: Full sentence prediction

### Session Management

1. When you train a model, you receive a `sessionId`
2. Use this `sessionId` in the `x-session-id` header for subsequent predictions
3. If no `sessionId` is provided, the API uses default English training text

## Deployment

### DigitalOcean App Platform
1. Fork this repository
2. Connect your DigitalOcean account
3. Create a new App from your forked repository
4. Deploy using Node.js settings:
   - Environment: Node.js
   - Build Command: `npm install`
   - Run Command: `npm start`


### Generate Training Text

To generate training text from datasets (Alice in Wonderland, AAC-like phrases, filtered dialogue):

1. Run the Python script:
   ```bash
   python generate_training_text.py
   ```
2. The generated text will be saved to `training_text.txt`.


### Issues

If you encounter any issues, please [open an issue](https://github.com/willwade/PPM-API/issues).

### License

This project is licensed under the GPL v 3.0 License - see the [LICENSE](LICENSE) file for details.


### Acknowledgements

PPM JS Was developed by Google Research - https://github.com/google-research/google-research/tree/master/jslm

