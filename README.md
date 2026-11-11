# 🏭 IoT-Based Worker Safety Zone Monitoring Using DNN

### An Intelligent IoT and Deep Learning System for Industrial Worker Safety

## 📌 Project Overview

Industrial environments contain hazardous and restricted areas where unauthorized worker entry can lead to serious safety risks. Manually monitoring every worker and tracking their movements is challenging.

**IoT-Based Worker Safety Zone Monitoring Using DNN** is an intelligent safety monitoring system designed to identify workers, monitor their location, classify zone-entry events, and generate alerts when unauthorized entry is detected.

The proposed system combines Internet of Things (IoT) technologies with Deep Neural Networks (DNN) to improve industrial safety through automated monitoring and intelligent event classification.

## 🎯 Objectives

- Identify individual workers using RFID-enabled ID cards.
- Monitor worker locations using UWB/GPS technologies.
- Collect and communicate sensor events using ESP32.
- Classify worker-zone events as Safe or Unauthorized.
- Apply Deep Neural Networks for intelligent intrusion detection.
- Generate alerts when unauthorized zone entry occurs.
- Activate a buzzer for immediate local warning.
- Provide a web-based dashboard for supervisor monitoring.
- Compare DNN performance with traditional machine learning models.

## 🏗️ System Architecture

The system follows an IoT-to-AI-to-Alert architecture.

```text
             WORKER
                |
         RFID Identification
                |
         UWB / GPS Tracking
                |
              ESP32
                |
          IoT Event Data
                |
         Data Preprocessing
                |
          DNN / MLP Model
                |
       Intrusion Probability
                |
        SAFE / UNAUTHORIZED
                |
         Alert Management
             /       \
         Buzzer    Web Dashboard
```

**Core Concept:**

- RFID identifies WHO the worker is.
- UWB/GPS determines WHERE the worker is.
- ESP32 collects and communicates IoT data.
- DNN analyzes the collected features.
- The alert system warns workers and supervisors.

## 🔌 IoT Components

| Component | Purpose |
|---|---|
| ESP32 | Microcontroller for collecting and communicating sensor data |
| RFID | Identifies workers through unique RFID tags/cards |
| UWB | Provides high-precision indoor location tracking |
| GPS | Provides geographical location information, mainly outdoors |
| Buzzer | Generates an immediate local warning |
| Potentiometer | Simulates a changing sensor/location parameter in Wokwi |

## 🧠 Artificial Intelligence – DNN Model

The primary AI model used in this project is a **PyTorch-based Multi-Layer Perceptron (MLP)**.

The model analyzes multiple worker-zone event features to estimate the probability of unauthorized intrusion.

### DNN Architecture

```text
Input Features
      |
128 Neurons
      |
ReLU + Dropout
      |
64 Neurons
      |
ReLU + Dropout
      |
32 Neurons
      |
ReLU
      |
1 Output Neuron
      |
Sigmoid Activation
      |
Intrusion Probability
```

### Model Configuration

- Framework: PyTorch
- Architecture: Multi-Layer Perceptron
- Hidden Layers: 128, 64, 32
- Activation Function: ReLU
- Dropout: 25%
- Output Activation: Sigmoid
- Loss Function: Binary Cross-Entropy
- Optimizer: Adam

### Input Features

The DNN can analyze the following features:

- Worker authorization status
- Zone type
- RFID detection status
- UWB location status
- GPS status
- Latitude and longitude
- Distance from permitted zone boundary
- Duration inside the zone
- Previous violation history
- Restricted-zone indicator
- Entry hour
- Sensor anomaly score

### Prediction

The model produces an intrusion probability between 0 and 1, which is used by the application to classify worker-zone events.

## 📊 Dataset and Preprocessing

The project uses a simulated worker-zone event dataset and aims to integrate real RFID records.

The initial synthetic dataset contains 3,000 worker-zone events.

### Data Preprocessing

**Categorical Features:**
- One-Hot Encoding

**Numerical Features:**
- StandardScaler

The processed features are provided to the DNN model for training and prediction.

## ⚖️ Model Benchmarking

To evaluate the effectiveness of the primary DNN model, additional models are used for comparison.

| Model | Purpose |
|---|---|
| PyTorch MLP | Primary Deep Learning model |
| XGBoost | Machine Learning baseline |
| TabPFN 2.5 | Tabular-data benchmark |

Models are evaluated using:

- Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC

## 🚨 Alert Mechanism

When an unauthorized zone-entry event is detected:

1. The worker identity and location information are collected.
2. The event features are preprocessed.
3. The DNN predicts the intrusion probability.
4. The application classifies the event.
5. An alert is generated for the supervisor.
6. The buzzer can be activated for a local warning.
7. The event can be recorded for monitoring and analysis.

## 🌐 Web Application

The planned web application provides a centralized interface for monitoring worker safety events.

### Main Features

- **Worker Monitoring:** View worker identification and location information.
- **Live DNN Predictor:** Analyze worker-zone events using the trained DNN.
- **Intrusion Alert Feed:** Display safe and unauthorized entry events.
- **Risk Prediction:** View intrusion probability and classification.
- **Model Comparison:** Compare DNN, XGBoost and TabPFN performance.
- **Supervisor Monitoring:** Provide visibility into safety events and alerts.
- **Architecture Visualization:** Display the complete IoT and AI workflow.

## 🧪 Wokwi Simulation

The IoT prototype is simulated using Wokwi.

### Components Used
- ESP32-C3
- Potentiometer
- Buzzer

### Simulation Workflow

```text
Potentiometer
      |
     ESP32
      |
Threshold-Based Logic
      |
   ---------
   |       |
  SAFE   RESTRICTED
   |       |
Buzzer OFF Buzzer ON
```

The potentiometer acts as a simulated sensor/location input.

- Low input value: Safe condition, buzzer OFF.
- High input value: Restricted condition, buzzer ON.

**Note:** The Wokwi simulation demonstrates the basic IoT sensing and alert mechanism. RFID, UWB/GPS tracking and DNN integration are part of the complete system design and are separate from this basic hardware simulation.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| IoT Hardware | ESP32 |
| Identification | RFID |
| Location Tracking | UWB, GPS |
| Simulation | Wokwi |
| Programming | Python, C/C++ |
| Deep Learning | PyTorch |
| Machine Learning | Scikit-learn, XGBoost, TabPFN |
| Data Processing | Pandas, NumPy |
| Frontend | React, Vite |
| Backend | Python, Flask |
| Visualization | Web Dashboard |

## 📁 Project Modules

1. IoT Data Collection
2. Worker Identification
3. Location and Zone Monitoring
4. Data Preprocessing
5. DNN Model Training
6. Intrusion Prediction
7. Model Benchmarking
8. Alert Generation
9. Supervisor Dashboard
10. Wokwi Hardware Simulation

## 🔮 Future Enhancements

- Integration with physical RFID readers and employee ID cards.
- Real-time indoor positioning using UWB anchors and tags.
- Outdoor worker tracking using GPS.
- Edge-based DNN inference for low-latency alerts.
- Mobile notifications for supervisors.
- Integration with larger real-world industrial safety datasets.
- Advanced analytics for identifying recurring safety violations.

## 🎯 Expected Outcome

The project aims to develop an intelligent worker safety monitoring solution that combines IoT-based identification and location monitoring with DNN-based event classification.

By integrating automated detection, local alerts and supervisor monitoring, the system aims to reduce the risks associated with unauthorized entry into hazardous industrial zones.

## 👩‍💻 Project Information

**Project Title:** IoT-Based Worker Safety Zone Monitoring Using DNN

**Domain:** Internet of Things (IoT), Artificial Intelligence, Deep Learning

**Application Area:** Industrial Safety and Worker Monitoring

**Project Type:** IoT + Deep Learning + Web Application

---

⭐ If you find this project interesting, feel free to explore the repository and follow its development.

**IoT senses. AI predicts. Alerts protect.**
