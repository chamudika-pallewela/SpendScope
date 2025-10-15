# Spently

> AI-powered financial transaction analysis platform that transforms bank statements into actionable insights.

## 🚀 Features

### 📄 **Smart Document Processing**

- Upload PDF bank statements via drag & drop or file browser
- Support for multiple bank formats and multiple files
- AI-powered transaction extraction and categorization

### 📊 **Comprehensive Financial Analysis**

- **Transaction Summary**: Total money in/out, net amounts, balance tracking
- **Smart Categorization**: Automatic spending categorization (food, bills, shopping, etc.)
- **Income Verification**: Regular income pattern detection and stability analysis
- **Affordability Reports**: Loan and purchase affordability calculations
- **AML Risk Assessment**: Suspicious transaction detection and risk scoring

### 📈 **Visual Analytics**

- Interactive charts and graphs
- Spending pattern visualization
- Monthly trend analysis
- Category-based breakdowns

### 🏦 **Multi-Bank Support**

- Works with any bank's PDF statements
- Multiple account analysis
- Bank comparison features

### 📱 **Export & Reporting**

- PDF report generation
- CSV data export
- Upload history tracking
- Print-ready financial reports

### 🔐 **Secure & User-Friendly**

- Firebase authentication (email/password + Google OAuth)
- Protected routes and secure data handling
- Responsive design for all devices
- No technical knowledge required

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI
- **Backend**: FastAPI (Python)
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **Charts**: ECharts
- **Build Tool**: Vite

## 🚀 Quick Start

### Prerequisites

- Node.js v18.x or higher
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/analyzr-ai.git
   cd analyzr-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**
   - Set up Firebase project and update `src/config/firebase.ts`
   - Configure API endpoints in `src/config/api.ts`

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Upload Statements**: Drag & drop your PDF bank statements
3. **View Analysis**: Get instant insights into your spending patterns
4. **Export Reports**: Download PDF or CSV reports for your records
5. **Track History**: View all your previous uploads and analyses

---

**Spently**: Transform your bank statements into financial insights with the power of AI.
