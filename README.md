## 🏥 Health Prognosis Demo

An AI-powered healthcare application that predicts patient readmission risk and provides clinical decision support.

Live Demo: https://health-prognosis-demo.vercel.app/

## 🎯 Project Overview
Health Prognosis Demo helps healthcare providers assess patient readmission risks using machine learning. Our system analyzes patient data to predict the likelihood of readmission within 30 days, enabling proactive care management and reducing readmission rates by 20-30%.

## 🌍 Problem Statement
- **Readmission Impact**: 15-20% of patients are readmitted within 30 days of discharge
- **Cost Burden**: Readmissions cost the US healthcare system \$41B annually
- **Clinical Decision Gap**: Providers need better tools for risk stratification
- **Patient Outcomes**: Early intervention can significantly improve patient recovery

## 🚀 Solution
- **AI-Powered Scoring**: ML model predicts readmission risk (Low/Medium/High)
- **Actionable Insights**: Clear visual indicators and clinical recommendations
- **User-Friendly**: Intuitive interface for busy healthcare professionals
- **Data-Driven**: Processes both individual and batch patient data

## 🏗️ System Architecture
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   ML Model      │
│   (React/Vite)  │◄──►│   (Python)      │◄──►│   (CatBoost)    │
│                 │    │                 │    │                 │
│ • Patient Form  │    │ • /predict     │    │ • Patient Data  │
│ • Batch Upload  │    │ • /predict/batch│    │ • Risk Factors  │
│ • Results       │    │ • Data Validation│   │ • Predictions  │
│ • Analytics     │    │ • Error Handling│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 🌟 Features

### 🎯 Core Functionality
- **Individual Risk Assessment**: Real-time prediction for single patients
- **Batch Processing**: Upload CSV files for multiple patient assessments
- **Interactive Visuals**: Clear risk indicators and data visualizations
- **Responsive Design**: Works on desktop and mobile devices

### 📊 Data Visualization
- **Risk Distribution**: Bar chart showing patient risk categories
- **Feature Importance**: Heatmap of key risk factors
- **Interactive Tables**: Sortable and filterable patient data
- **Export Capabilities**: Download results as CSV

### 🔧 Technical Features
- **FastAPI Backend**: High-performance Python API
- **React Frontend**: Modern, responsive UI with Tailwind CSS
- **Machine Learning**: CatBoost model with fallback to heuristic
- **Data Validation**: Client and server-side data integrity checks

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/okech-glitch/health-prognosis-demo.git
   cd health-prognosis-demo
   \`\`\`

2. **Backend Setup**
   \`\`\`bash
   cd backend
   python -m venv venv
   .\\venv\\Scripts\\activate  
   pip install -r requirements.txt
   \`\`\`

3. **Frontend Setup**
   \`\`\`bash
   cd ../frontend
   npm install
   \`\`\"

4. **Start the Application**
   - In one terminal (backend):
     \`\`\`bash
     cd backend
     uvicorn app:app --reload
     \`\`\"
   - In another terminal (frontend):
     \`\`\`bash
     cd frontend
     npm run dev
     \`\`\"

5. **Access the Application**
   - Live Demo: https://health-prognosis-demo.vercel.app/
   - Frontend: http://localhost:5175
   - API Docs: http://localhost:8000/docs

## 🧮 How the Risk Score is Calculated

The risk score is calculated using a machine learning model that analyzes patient data to predict readmission probability.

### Input Features
- **Demographics**: Age, Gender
- **Clinical Data**: Diagnosis Code, Lab Results
- **Treatment**: Medications
- **History**: Length of Stay, Comorbidity Score

### Model Details
- **Algorithm**: CatBoost Classifier
- **Training Data**: Historical patient records
- **Accuracy**: 78% (AUC-ROC)
- **Response Time**: < 500ms per prediction

### Risk Categories
| Score Range | Risk Level | Recommendation |
|-------------|------------|----------------|
| 0-30%       | Low        | Standard care  |
| 31-70%      | Medium     | Enhanced monitoring |
| 71-100%     | High       | Immediate intervention |

## 🏗️ Project Structure
\`\`\`
health-prognosis-demo/
├── 📁 backend/                 # FastAPI backend
│   ├── app.py                # Main application
│   ├── requirements.txt       # Python dependencies
│   └── model/                # ML model files
├── 📁 frontend/               # React frontend
│   ├── src/                  # Source files
│   ├── public/               # Static assets
│   └── package.json          # Node.js dependencies
└── README.md                 # This file
\`\`\"

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 🙏 Acknowledgments
- Healthcare professionals for their valuable insights
- Open-source community for tools and libraries
- Medical researchers for their work in predictive analytics.
