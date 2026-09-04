# Heart Disease Classification Using Deep Neural Network

> **Academic Project — Neural Networks / Deep Learning**
> A complete end-to-end web application for heart disease risk classification using a trained Deep Neural Network.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Features](#4-features)
5. [Technologies Used](#5-technologies-used)
6. [Dataset](#6-dataset)
7. [Data Preprocessing](#7-data-preprocessing)
8. [DNN Architecture](#8-dnn-architecture)
9. [Training Methodology](#9-training-methodology)
10. [Evaluation Metrics](#10-evaluation-metrics)
11. [API Documentation](#11-api-documentation)
12. [Frontend Description](#12-frontend-description)
13. [Installation](#13-installation)
14. [How to Train the Model](#14-how-to-train-the-model)
15. [How to Start the Backend](#15-how-to-start-the-backend)
16. [How to Start the Frontend](#16-how-to-start-the-frontend)
17. [Example Prediction](#17-example-prediction)
18. [Limitations](#18-limitations)
19. [Future Scope](#19-future-scope)
20. [Medical Disclaimer](#20-medical-disclaimer)
21. [Viva Questions and Answers](#21-viva-questions-and-answers)
22. [Project Report Content](#22-project-report-content)

---

## 1. Project Overview

HeartGuard AI is an academic web application that uses a Deep Neural Network (DNN) trained on the UCI Heart Disease (Cleveland) dataset to classify whether a patient is at risk of heart disease based on 13 clinical parameters.

The system demonstrates end-to-end machine learning engineering:
- Data preprocessing and feature scaling
- Deep Neural Network design with TensorFlow/Keras
- REST API backend with FastAPI
- Responsive React frontend with real-time predictions

---

## 2. Problem Statement

Heart disease is the leading cause of death globally. Early identification of at-risk patients using clinical data can assist healthcare professionals in prioritising treatment. However, manual interpretation of multiple clinical parameters is time-consuming and error-prone.

This project builds an automated classification system using Deep Neural Networks that can predict the likelihood of heart disease from standard clinical test results.

---

## 3. Objectives

- Learn and implement a Deep Neural Network for binary classification.
- Understand and apply proper data preprocessing (scaling, missing value handling, stratified splitting).
- Build a production-style REST API using FastAPI.
- Develop a responsive React frontend for a complete user experience.
- Evaluate the model rigorously using multiple metrics.
- Demonstrate key DNN concepts: forward propagation, backpropagation, dropout, batch normalisation.

---

## 4. Features

- 13-feature patient input form with human-readable labels
- Real-time heart disease risk prediction (Low / Moderate / High)
- Probability score visualised as a radial gauge
- Patient input summary card
- Model performance dashboard (Accuracy, Precision, Recall, F1, ROC-AUC)
- DNN architecture viewer
- Feature reference documentation
- Fully responsive design (desktop, tablet, mobile)
- Medical disclaimer on every prediction

---

## 5. Technologies Used

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Deep Learning  | TensorFlow 2.16 / Keras                 |
| Data Science   | NumPy, Pandas, Scikit-learn             |
| Visualisation  | Matplotlib, Seaborn, Recharts           |
| Backend        | FastAPI, Uvicorn, Pydantic              |
| Frontend       | React 18, Vite, Tailwind CSS, Recharts  |
| Environment    | Python venv, Node.js                    |

---

## 6. Dataset

**Name:** UCI Heart Disease Dataset (Cleveland subset)
**Source:** https://archive.ics.uci.edu/ml/datasets/Heart+Disease
**Samples:** 303 patients
**Features:** 13 clinical features + 1 target variable

| Feature   | Type        | Description                                    |
|-----------|-------------|------------------------------------------------|
| age       | Numerical   | Age in years                                   |
| sex       | Binary      | 0=Female, 1=Male                               |
| cp        | Categorical | Chest pain type (0–3)                          |
| trestbps  | Numerical   | Resting blood pressure (mm Hg)                 |
| chol      | Numerical   | Serum cholesterol (mg/dl)                      |
| fbs       | Binary      | Fasting blood sugar > 120 mg/dl                |
| restecg   | Categorical | Resting ECG result (0–2)                       |
| thalach   | Numerical   | Maximum heart rate achieved (bpm)              |
| exang     | Binary      | Exercise-induced angina                        |
| oldpeak   | Numerical   | ST depression (exercise vs rest)               |
| slope     | Categorical | Slope of peak exercise ST segment              |
| ca        | Ordinal     | Number of major vessels (0–4)                  |
| thal      | Categorical | Thalassemia type (0–3)                         |
| **target**| **Binary**  | **0 = No Heart Disease, 1 = Disease Present**  |

---

## 7. Data Preprocessing

1. **Load dataset** — from local CSV or via `ucimlrepo` package.
2. **Binarise target** — UCI raw target is 0–4; mapped to 0 (no disease) or 1 (disease).
3. **Handle missing values** — median imputation for numerical, mode for categorical.
4. **Stratified split** — 70% train / 15% validation / 15% test, preserving class ratios.
5. **StandardScaler** — fitted ONLY on training data, then applied to val/test (prevents data leakage).
6. **Class weights** — computed to handle mild class imbalance during training.

---

## 8. DNN Architecture

```
Input (13 features)
       ↓
Dense(128) → BatchNorm → ReLU → Dropout(0.30)
       ↓
Dense(64)  → BatchNorm → ReLU → Dropout(0.30)
       ↓
Dense(32)  → BatchNorm → ReLU → Dropout(0.20)
       ↓
Dense(1)   → Sigmoid
       ↓
P(Heart Disease) ∈ [0, 1]
```

**Why these choices:**
- **ReLU** — avoids vanishing gradients, computationally efficient.
- **BatchNormalization** — normalises layer inputs, speeds up convergence.
- **Dropout** — randomly disables neurons during training to prevent overfitting.
- **Sigmoid output** — ideal for binary classification; gives a probability.
- **Binary Cross-Entropy** — standard loss for binary classification problems.
- **Adam optimizer** — adaptive learning rate, converges faster than SGD.

---

## 9. Training Methodology

- **Epochs:** up to 200 (early stopping halts training early)
- **Batch size:** 32
- **Learning rate:** 0.001 (reduced by 50% on plateau)
- **Early stopping:** patience=20, restores best weights
- **Class weights:** automatically computed to handle imbalance
- **Validation:** held-out 15% split monitored every epoch

---

## 10. Evaluation Metrics

| Metric      | Description                                              |
|-------------|----------------------------------------------------------|
| Accuracy    | % of total predictions that are correct                 |
| Precision   | Of predicted positives, how many are truly positive      |
| Recall      | Of all actual positives, how many were found             |
| F1-Score    | Harmonic mean of precision and recall                    |
| ROC-AUC     | Model's ability to separate the two classes              |
| Confusion Matrix | TP / TN / FP / FN breakdown                        |

---

## 11. API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### GET /
Returns API info.

#### GET /health
Returns whether the model is loaded and ready.

#### GET /metrics
Returns saved evaluation metrics from the last training run.

#### POST /predict
**Request body:**
```json
{
  "age": 55,
  "sex": 1,
  "cp": 2,
  "trestbps": 140,
  "chol": 250,
  "fbs": 0,
  "restecg": 1,
  "thalach": 150,
  "exang": 0,
  "oldpeak": 1.2,
  "slope": 1,
  "ca": 0,
  "thal": 2
}
```

**Response:**
```json
{
  "prediction": "Higher likelihood of heart disease",
  "probability": 0.87,
  "risk_level": "High",
  "disclaimer": "This prediction is generated by an AI model for educational and research purposes only..."
}
```

Interactive API docs: http://localhost:8000/docs

---

## 12. Frontend Description

- **HomePage:** Patient input form with 13 clinical fields, real-time validation, prediction result card with radial gauge.
- **DashboardPage:** Model metrics bar chart, DNN architecture diagram, dataset info, feature reference table.
- **Responsive:** Works on desktop, tablet, and mobile.
- **Error handling:** Backend unavailable, validation errors, server errors — all handled gracefully.

---

## 13. Installation

### Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ and npm
- Git

### Clone the repository
```bash
git clone <your-repo-url>
cd heart-disease-dnn
```

### Python virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Install training dependencies
```bash
pip install -r training/requirements.txt
```

### Install backend dependencies
```bash
pip install -r backend/requirements.txt
```

### Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 14. How to Train the Model

```bash
# Make sure venv is activated
python training/train.py
```

This will:
1. Download/load the dataset into `data/heart.csv`
2. Preprocess and split the data
3. Build and train the DNN
4. Save the model to `backend/model/heart_disease_model.keras`
5. Save the scaler to `backend/model/scaler.pkl`
6. Save the training history to `results/training_history.json`

Then generate evaluation plots:
```bash
python training/evaluate.py
```

Plots saved to `results/`:
- `accuracy_curve.png`
- `loss_curve.png`
- `confusion_matrix.png`
- `roc_curve.png`
- `metrics_summary.png`

---

## 15. How to Start the Backend

```bash
# From the project root, with venv activated
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

---

## 16. How to Start the Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

---

## 17. Example Prediction

**Input:** 55-year-old male, atypical chest pain, resting BP 140 mm Hg,
cholesterol 250 mg/dl, max heart rate 150 bpm, ST depression 1.2.

**Expected output:**
```json
{
  "prediction": "Higher likelihood of heart disease",
  "probability": 0.83,
  "risk_level": "High",
  "disclaimer": "..."
}
```

---

## 18. Limitations

- Trained on a small dataset (303 samples from 1988).
- Only Cleveland subset of UCI data used.
- Binary classification does not capture disease severity.
- Model performance may vary on populations different from the training data.
- No SHAP/LIME explainability — predictions are not interpretable at the feature level.
- Not clinically validated.

---

## 19. Future Scope

- Train on larger, more diverse datasets (UK Biobank, NHANES).
- Add SHAP or LIME for explainable AI — show which features most influenced the prediction.
- Ensemble models (Random Forest + DNN) for improved robustness.
- SMOTE or other oversampling for better class balance.
- Mobile application (React Native / Flutter).
- Cloud deployment (AWS / GCP / Azure) with CI/CD pipeline.
- Integration with wearable device data (heart rate monitors, smartwatches).
- Continuous model monitoring and retraining pipeline.

---

## 20. Medical Disclaimer

**IMPORTANT:** This application is developed solely for academic and educational purposes to demonstrate Deep Neural Network concepts. It is NOT a medical diagnostic tool, has NOT been clinically validated, and MUST NOT be used to make real medical decisions. Always consult a qualified and licensed healthcare professional for any medical concerns. The developers accept no liability for any actions taken based on this system's output.

---

## 21. Viva Questions and Answers

### Q1. What is an Artificial Neural Network (ANN)?
An ANN is a computational model inspired by the structure of biological neurons in the brain. It consists of interconnected nodes (neurons) organised in layers — an input layer, one or more hidden layers, and an output layer. Each connection has a weight, and neurons apply an activation function to their weighted input sum.

### Q2. What is a Deep Neural Network (DNN)?
A DNN is an ANN with multiple (more than one) hidden layers. The word "deep" refers to the depth — the number of layers. Each layer learns progressively more abstract representations of the input data. Our model has 3 hidden layers, making it a DNN.

### Q3. Why use DNN instead of traditional ML (like Logistic Regression)?
Traditional ML uses hand-crafted features and linear decision boundaries. DNNs can automatically learn non-linear, hierarchical feature representations from raw data. For complex medical datasets with non-linear interactions between features, DNNs can capture patterns that simpler models miss.

### Q4. What is a neuron in a neural network?
A neuron receives inputs, multiplies each by a weight, adds a bias, and passes the result through an activation function. Mathematically: output = activation(W·x + b), where W is the weight vector, x is the input, and b is the bias.

### Q5. What is forward propagation?
Forward propagation is the process of passing input data through each layer of the network from input to output, computing activations at each layer, to produce a final prediction. No weights are changed during forward propagation.

### Q6. What is backpropagation?
Backpropagation is the algorithm used to train neural networks. After computing the loss (error), backpropagation calculates the gradient of the loss with respect to each weight using the chain rule of calculus. These gradients tell us how to adjust each weight to reduce the loss.

### Q7. What is gradient descent?
Gradient descent is an optimisation algorithm that minimises the loss function by iteratively adjusting weights in the direction opposite to the gradient: w = w - η·(∂L/∂w), where η is the learning rate. Adam is an improved version of gradient descent that adapts the learning rate for each parameter.

### Q8. What is an activation function? Why is it needed?
An activation function introduces non-linearity into the network. Without activation functions, stacking multiple layers is mathematically equivalent to a single linear layer, which cannot learn complex patterns. Common activations: ReLU, Sigmoid, Tanh, Softmax.

### Q9. Why did you use ReLU?
ReLU (Rectified Linear Unit) f(x) = max(0, x) is preferred because:
- It avoids the vanishing gradient problem (gradients don't diminish as layers deepen).
- It is computationally simple and fast.
- It tends to produce sparse activations, which is beneficial for regularisation.

### Q10. Why use Sigmoid in the output layer?
Sigmoid squashes any real number to the range [0, 1], which is exactly what we need for a binary classification probability. P(heart disease) = sigmoid(z) gives us a value we can threshold at 0.5.

### Q11. What is a loss function? Which did you use?
A loss function measures how wrong the model's predictions are. We used Binary Cross-Entropy:
L = -[y·log(ŷ) + (1-y)·log(1-ŷ)]
where y is the true label and ŷ is the predicted probability. This loss is large when the model is confident and wrong, and small when it is confident and correct.

### Q12. What is an optimiser? Which did you use?
An optimiser uses computed gradients to update weights. We used Adam (Adaptive Moment Estimation), which maintains moving averages of gradients and squared gradients to adaptively scale the learning rate for each weight. Adam typically converges faster and is less sensitive to hyperparameters than basic SGD.

### Q13. What are epochs and batch size?
- **Epoch:** One complete pass through the entire training dataset.
- **Batch size:** The number of training samples used in one forward/backward pass before updating weights. With batch_size=32 and 180 training samples, there are ~6 iterations per epoch.

### Q14. What is overfitting?
Overfitting occurs when the model learns the training data too well, including noise, and fails to generalise to unseen data. Signs: very high training accuracy but much lower validation accuracy.

### Q15. What is dropout? How does it help?
Dropout randomly sets a fraction of neurons to zero during each training step. This prevents neurons from co-adapting (relying on each other), forcing the network to learn more robust, distributed representations. It acts as an implicit ensemble of many different network architectures.

### Q16. What is Batch Normalisation?
Batch Normalisation normalises the inputs to each layer across the mini-batch: it subtracts the mean and divides by the standard deviation, then applies learned scale (γ) and shift (β) parameters. This stabilises training, allows higher learning rates, and reduces sensitivity to initialisation.

### Q17. What is the train/val/test split? Why do we need three sets?
- **Training set:** Used to update model weights.
- **Validation set:** Used to monitor performance during training and tune hyperparameters (does not update weights).
- **Test set:** Used ONCE at the end to estimate real-world performance on completely unseen data.
Three sets prevent data leakage — if we use test data for tuning, our evaluation is optimistically biased.

### Q18. What is feature scaling? Why is it needed?
Feature scaling transforms numerical features to a common scale. Without scaling, features with large ranges (e.g., cholesterol ~200) dominate those with small ranges (e.g., fbs = 0/1), causing the gradient to be dominated by large-magnitude features. StandardScaler: z = (x - mean) / std.

### Q19. What is data leakage?
Data leakage occurs when information from the test (or future) data influences model training or preprocessing, making the model appear better than it is. In our project, we prevent leakage by fitting the StandardScaler ONLY on training data, then applying it to validation and test sets.

### Q20. What is a confusion matrix?
A confusion matrix is a 2×2 table showing:
- True Positives (TP): Disease correctly predicted
- True Negatives (TN): No disease correctly predicted
- False Positives (FP): Healthy patient incorrectly predicted as diseased
- False Negatives (FN): Diseased patient incorrectly predicted as healthy
FN is most dangerous in medical applications — it means missing a real case.

### Q21. What is accuracy? What are its limitations?
Accuracy = (TP + TN) / Total. It tells us the overall percentage of correct predictions. Limitation: on imbalanced datasets (e.g., 90% no disease), a model predicting "no disease" always achieves 90% accuracy but is useless.

### Q22. What is precision?
Precision = TP / (TP + FP). Of all patients the model predicted as having disease, what fraction actually have disease. High precision means few false alarms.

### Q23. What is recall (sensitivity)?
Recall = TP / (TP + FN). Of all patients who actually have disease, what fraction did the model correctly identify. High recall means fewer missed cases. In medical contexts, high recall is critical.

### Q24. What is F1-score?
F1 = 2 × (Precision × Recall) / (Precision + Recall). It is the harmonic mean of precision and recall. Useful when we need a single metric that balances both, especially on imbalanced datasets.

### Q25. What is ROC-AUC?
ROC (Receiver Operating Characteristic) curve plots True Positive Rate vs False Positive Rate at various thresholds. AUC (Area Under Curve) summarises this curve as a single number between 0 and 1. AUC = 0.5 → random classifier; AUC = 1.0 → perfect classifier.

### Q26. What is class imbalance?
Class imbalance occurs when one class has significantly more samples than another. In the UCI dataset, the classes are fairly balanced (~54% disease, ~46% no disease), but we still apply class weights to be safe. Severe imbalance can cause the model to ignore the minority class.

### Q27. Why use TensorFlow/Keras?
TensorFlow/Keras is the industry standard for building deep learning models. Keras provides a high-level, readable API for defining layers, while TensorFlow handles GPU acceleration, automatic differentiation, and model saving. Both are widely supported in academic and industry settings.

### Q28. Why use FastAPI?
FastAPI is a modern, high-performance Python web framework. It has automatic request validation using Pydantic, auto-generated interactive API docs (/docs), async support, and is much faster than Flask. It is ideal for serving ML models.

### Q29. How does the frontend communicate with the backend?
The React frontend uses the Axios HTTP library to send a POST request to `/predict` on the FastAPI backend. The request body contains the 13 patient features as JSON. The backend validates, preprocesses, runs inference, and returns a JSON response. React then renders the result.

### Q30. What are the limitations of your system?
- Small training dataset (303 samples).
- No explainability (cannot say which features most influenced the prediction).
- Binary only — does not measure disease severity.
- Not clinically validated.
- Performance may degrade on populations different from the UCI Cleveland dataset.
- Model could be biased by historical data patterns in the 1988 dataset.

### Q31. Why can't this system replace a doctor?
Because: (1) it is trained on a very small, old dataset, (2) it has no clinical validation, (3) it cannot account for patient history, symptoms, physical examination, and other contextual factors that a doctor uses, (4) a wrong prediction can have life-threatening consequences, and (5) medical diagnosis requires legal and ethical accountability that an AI model cannot provide.

---

## 22. Project Report Content

### Chapter 1: Introduction

Heart disease remains the world's leading cause of mortality, responsible for approximately 17.9 million deaths annually (WHO, 2023). Early and accurate risk stratification of patients is critical for timely intervention and improved outcomes. Traditional risk assessment involves manual interpretation of multiple clinical parameters, a process that is time-intensive and subject to human error.

Artificial Intelligence, and specifically Deep Neural Networks, offer a powerful tool for automated pattern recognition in clinical data. This project implements a complete, end-to-end AI system that classifies heart disease risk from 13 clinical features using a Deep Neural Network trained on the UCI Heart Disease (Cleveland) dataset.

The system consists of three components: a Python-based training pipeline, a FastAPI REST backend, and a React frontend — together forming a complete web application suitable for educational demonstration.

---

### Chapter 2: Problem Statement and Objectives

**Problem Statement:**
Given a set of 13 clinical parameters for a patient, predict with high accuracy whether the patient is likely to have heart disease.

**Objectives:**
1. Implement a Deep Neural Network for binary classification.
2. Apply rigorous data preprocessing to avoid data leakage.
3. Evaluate the model with multiple metrics beyond accuracy.
4. Build a production-ready REST API to serve predictions.
5. Develop a responsive web frontend for end-user interaction.
6. Demonstrate key concepts of deep learning applicable to the course.

---

### Chapter 3: Technology Overview

**Deep Learning Framework — TensorFlow/Keras:**
TensorFlow is an open-source deep learning framework developed by Google. Keras is its high-level API. Together they enable rapid prototyping of neural networks, automatic differentiation for backpropagation, and GPU acceleration.

**Data Processing — Pandas & Scikit-learn:**
Pandas provides efficient DataFrame operations for data loading and cleaning. Scikit-learn provides preprocessing tools (StandardScaler), model evaluation metrics, and train/test splitting utilities.

**Backend — FastAPI:**
FastAPI is a modern Python framework for building APIs. It uses Pydantic for automatic request validation and generates interactive documentation. It is significantly faster than Flask and Django for I/O-bound applications.

**Frontend — React & Tailwind CSS:**
React is a component-based JavaScript library for building user interfaces. Vite provides fast hot-module-replacement development. Tailwind CSS is a utility-first CSS framework enabling rapid, consistent UI development.

---

### Chapter 4: Dataset and Data Preprocessing

**Dataset Description:**
The UCI Heart Disease (Cleveland) dataset contains 303 patient records collected at the Cleveland Clinic Foundation. It includes 13 clinical and demographic features and a binary target variable indicating presence of heart disease.

**Preprocessing Steps:**
1. Load from local CSV or UCI repository API.
2. Binarise target variable (0 = no disease, 1 = disease).
3. Impute missing values: median for numerical, mode for categorical.
4. Stratified train/val/test split (70/15/15).
5. Fit StandardScaler on training data only.
6. Transform validation and test sets using the fitted scaler.
7. Compute class weights for imbalanced training.
8. Save scaler for consistent inference-time preprocessing.

**Why StandardScaler?**
Neural networks use gradient-based optimisation. If features are on different scales, gradients are dominated by large-valued features, causing slow or unstable convergence. StandardScaler standardises each feature to zero mean and unit variance.

---

### Chapter 5: Deep Neural Network Methodology

**Architecture Design Rationale:**

The input layer accepts 13 scaled features. Three hidden layers with 128, 64, and 32 neurons respectively create a funnel-shaped architecture that gradually compresses the representation. This is a common design principle — wider early layers capture broad patterns, narrower later layers refine them.

**Forward Propagation:**
For each layer l: z^(l) = W^(l) · a^(l-1) + b^(l); a^(l) = ReLU(z^(l))
Final output: ŷ = sigmoid(z^(output))

**Loss Function:**
Binary Cross-Entropy: L = -[y·log(ŷ) + (1-y)·log(1-ŷ)]

**Backpropagation:**
Using the chain rule: ∂L/∂W^(l) = ∂L/∂a^(l) · ∂a^(l)/∂z^(l) · ∂z^(l)/∂W^(l)
Adam optimizer updates: m = β₁m + (1-β₁)g; v = β₂v + (1-β₂)g²; W = W - η·m̂/√v̂

**Regularisation:**
- Dropout(0.3) after layers 1 and 2; Dropout(0.2) after layer 3.
- Early Stopping with patience=20 to prevent overfitting.
- Class weights to handle mild class imbalance.

---

### Chapter 6: System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User's Browser                      │
│                   React Frontend (Vite)                   │
│         PatientForm → Axios POST → PredictionResult       │
└────────────────────────┬────────────────────────────────-┘
                         │ HTTP / JSON
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (:8000)                  │
│   POST /predict → PatientInput (Pydantic) → predictor    │
│                     GET /metrics                         │
└────────────────────────┬────────────────────────────────-┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
heart_disease_model.keras          scaler.pkl
 (TensorFlow/Keras DNN)        (scikit-learn StandardScaler)
```

---

### Chapter 7: Implementation

The implementation spans three components:

**Training Pipeline (`training/`):**
- `preprocess.py` — loads, cleans, scales, and splits the dataset.
- `train.py` — builds the DNN, trains with early stopping, saves artifacts.
- `evaluate.py` — loads test data, computes metrics, generates all plots.

**Backend (`backend/`):**
- `main.py` — FastAPI app with `/predict`, `/health`, `/metrics` endpoints.
- `schemas/patient.py` — Pydantic models for validation.
- `services/predictor.py` — singleton model loader and inference service.

**Frontend (`frontend/src/`):**
- `pages/HomePage.jsx` — patient form and prediction result.
- `pages/DashboardPage.jsx` — metrics dashboard.
- `components/PatientForm.jsx` — 13-field validated form.
- `components/PredictionResult.jsx` — result card with gauge.
- `components/MetricsCard.jsx` — performance bar chart.
- `services/api.js` — Axios API client.

---

### Chapter 8: Results and Evaluation

After training, the model is evaluated on the held-out test set using five metrics. All plots are saved to the `results/` directory.

**Expected performance range on UCI Cleveland dataset:**
- Accuracy: 82–87%
- F1-Score: 83–88%
- ROC-AUC: 0.88–0.93

The confusion matrix breakdown reveals the false negative rate (missed disease cases), which is the most safety-critical metric in a medical context.

---

### Chapter 9: Limitations

- The UCI Cleveland dataset contains only 303 samples, which is small for a deep learning model.
- The dataset was collected in 1988 and may not reflect modern patient populations.
- Binary classification does not capture disease severity (mild vs severe).
- The model provides no explanation of which features influenced the prediction.
- Performance has not been validated in any clinical setting.

---

### Chapter 10: Future Scope

- Train on larger, diverse datasets (UK Biobank, NHANES).
- Implement SHAP/LIME for prediction explainability.
- Apply SMOTE oversampling to improve class balance handling.
- Build ensemble models combining DNN with Random Forest or XGBoost.
- Develop a mobile application using React Native.
- Deploy to cloud with automated CI/CD retraining pipeline.
- Integrate with wearable device streams for real-time monitoring.

---

### Chapter 11: Conclusion

This project successfully demonstrates the end-to-end development of a Deep Neural Network-based heart disease classification system. The model achieves strong performance on the UCI Cleveland dataset and is deployed through a professional REST API and React frontend.

The project covers all key concepts of the Neural Networks / Deep Learning course: forward propagation, backpropagation, gradient descent, activation functions, loss functions, dropout regularisation, batch normalisation, and rigorous model evaluation.

While the system is built for educational purposes and cannot replace clinical diagnosis, it demonstrates that AI has significant potential to assist healthcare professionals when built with proper data practices, rigorous evaluation, and appropriate safeguards.
