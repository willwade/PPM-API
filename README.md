
# PPM Prediction API

This repository contains a **Prediction by Partial Matching (PPM)** API that provides language modeling and text predictions. The API supports character-level, word-level, and sentence-level predictions, with default training data or user-provided text.

## Features

- Train a PPM model with user-provided text via URL or default training data.
- Predict the next characters, words, or sentences with probabilities and perplexity.
- Interactive API documentation available via Swagger.
- Default integration with datasets like Alice in Wonderland, AAC-like phrases, and filtered dialogue datasets.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (16.x or later)
- **npm** (7.x or later)
- **Python** (3.7 or later) with `pip`
- Internet access for fetching datasets

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

#### API Endpoints

1. **Train the Model**
   - **URL**: `POST /train`
   - **Request Body**:
     ```json
     {
       "url": "https://example.com/text"
     }
     ```
   - If no URL is provided, the API uses default training text from `data/default_training.txt`.

2. **Predict Text**
   - **URL**: `POST /predict`
   - **Request Body**:
     ```json
     {
       "input": "The quick",
       "level": "word"
     }
     ```
   - **Levels**:
     - `letter`: Character-level predictions
     - `word`: Word-level predictions
     - `sentence`: Sentence-level predictions

3. **Health Check**
   - **URL**: `GET /`
   - **Response**: `200 OK`

4. **Swagger Documentation**
   - Access Swagger documentation at:
     ```
     http://localhost:8080/api-docs
     ```

### Generate Training Text

To generate training text from datasets (Alice in Wonderland, AAC-like phrases, filtered dialogue):

1. Run the Python script:
   ```bash
   python generate_training_text.py
   ```
2. The generated text will be saved to `training_text.txt`.

### File Structure

```
PPM-API/
├── controllers/
│   ├── trainController.js    # Training logic
│   ├── predictController.js  # Prediction logic
├── data/
│   ├── default_training.txt  # Default training text
├── scripts/
│   ├── run-python.js         # Node.js script to execute Python
├── generate_training_text.py # Script to generate training text
├── app.js                    # Main application entry point
├── package.json              # Node.js project config
└── README.md                 # This file
```

### Development

#### Run in Development Mode
Use `nodemon` for hot-reloading during development:
```bash
npm run dev
```

#### Lint the Code
Run ESLint to check for code issues:
```bash
npm run lint
```

#### Test the API
Use Jest to run tests:
```bash
npm test
```

### Deployment

1. Deploy the API to a cloud platform (e.g., DigitalOcean App Platform or Heroku).
2. Ensure the `default_training.txt` file is present and accessible in the deployment environment.

### Issues

If you encounter any issues, please [open an issue](https://github.com/willwade/PPM-API/issues).

### License

This project is licensed under the GPL v 3.0 License - see the [LICENSE](LICENSE) file for details.
