# Universal CSV Visualizer - VSB TUO

A comprehensive web application for CSV data visualization and AI-powered predictions using ConvLSTM neural networks.

## 🎯 Overview

This application provides:
- **CSV Data Import & Visualization**: Upload and visualize CSV files with interactive charts
- **AI Predictions**: Time series forecasting using ConvLSTM neural networks
- **Real-time Progress**: Live updates during AI training via Server-Sent Events (SSE)
- **Multi-chart Support**: Create and manage multiple charts simultaneously

## 📋 Prerequisites

### Required Software

1. **Node.js** (v16.0.0 or higher)
   - Download from: https://nodejs.org/
   - I use v22.14.0

2. **Python**
   - **TensorFlow compatibility**: Python 3.9–3.12 is specifically recommended from TensorFlow
   - Other Python versions may cause TensorFlow installation issues (see more https://www.tensorflow.org/install/pip?hl=fr)
   - I use 3.11.9

### Python Dependencies

The following Python packages are required for AI predictions:

```bash
pip install tensorflow==2.15.0
pip install numpy==1.24.3
pip install pandas==2.0.3
pip install scikit-learn==1.3.0
pip install matplotlib==3.7.2
```

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd GraphTest
```

### Step 2: Install Backend Dependencies

```bash
cd Graph-Backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../Graph-Frontend
npm install
```

### Step 4: Configure Python Path

**If Python is not found automatically**, edit the following file:

**File**: `Graph-Backend/services/pythonExecutor.js`
**Line 6**: Change the Python path if needed:

```javascript
// Default (try this first)
this.pythonPath = 'python';

// If 'python' doesn't work, try:
this.pythonPath = 'python3';

// If Python is in a specific location, use full path:
this.pythonPath = 'C:\\Python311\\python.exe';  // Windows
this.pythonPath = '/usr/bin/python3.11';       // Linux/Mac
```

## Running the Application

### Quick Start (Windows)

Use the provided batch files:

```bash
# Development
Start-Dashboard.bat

# Production
Start-Dashboard-Production.bat
```

### Development Mode

1. **Start Backend Server**:
   ```bash
   cd Graph-Backend
   npm run server
   ```
   Server will run on: http://localhost:3000

2. **Start Frontend** (in a new terminal):
   ```bash
   cd Graph-Frontend
   npm run serve
   ```
   Frontend will run on: http://localhost:8080

3. **Access Application**:
   - Open browser and go to: http://localhost:8080
   - Hot reaload should be enabled

### Production Mode

1. **Build Frontend**:
   ```bash
   cd Graph-Frontend
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   cd Graph-Backend
   npm start
   ```
   Application will be available at: http://localhost:3000

## 🐛 Troubleshooting

### Common Issues

1. **Python Not Found Error**
   ```
   Error: Python not found
   ```
   **Solution**: Update the Python path in `pythonExecutor.js` (see Step 4 above)

2. **TensorFlow Installation Issues**
   ```
   ERROR: Could not find a version that satisfies the requirement tensorflow
   ```
   **Solution**: 
   - Use Python 3.11.9 specifically (it worked for me)
   - Install TensorFlow: `pip install tensorflow==2.15.0`

3. **Crash when starting the app**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   **Solution**: 
   - Kill the process: `taskkill /f /im node.exe`

Or contact me

## 🎓 VSB TUO

This project was developed for VSB - Technical University of Ostrava.

---
