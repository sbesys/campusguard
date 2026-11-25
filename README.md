
# 🛡️ CampusGuard
### Institutional Continuity & Cascading Failure Simulation Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://campusguard-ruby.vercel.app/)

CampusGuard is a constraint-based institutional digital twin designed to help colleges understand, simulate, and manage cascading failures across critical campus infrastructure.

A college depends on interconnected systems such as electricity, network connectivity, water supply, laboratories, classrooms, security, and administrative services. A failure in one system can affect several others.

CampusGuard visualizes these dependencies, simulates infrastructure disruptions, identifies their potential impact, and helps institutions explore recovery strategies to maintain essential operations.

---

## 🚨 Problem Statement

Educational institutions depend on multiple interconnected infrastructure systems to function efficiently. A disruption in one critical system can trigger cascading failures across several departments and services.

Traditional monitoring systems often focus on individual components rather than the interconnected dependencies between them.

CampusGuard addresses this challenge by providing a centralized digital twin that helps visualize infrastructure dependencies, simulate failures, understand cascading impacts, and explore recovery decisions.

---

## 💡 Our Solution

CampusGuard creates a digital representation of a college's critical infrastructure and its dependencies.

The platform allows users to:

- Monitor critical campus infrastructure.
- Visualize interconnected systems and their dependencies.
- Simulate infrastructure failures.
- Understand cascading impacts.
- Identify critical infrastructure nodes.
- Explore recovery and mitigation strategies.
- Monitor institutional continuity through a centralized dashboard.

---

## ✨ Features

### 📊 Institutional Dashboard
Provides a centralized overview of institutional infrastructure, system status, operational conditions, and potential disruptions.

### 🌐 Infrastructure Network
Visualizes interconnected campus infrastructure and dependencies between critical systems.

### ⚡ Cascading Failure Simulation
Simulates the impact of infrastructure failures and demonstrates how disruptions can propagate through interconnected systems.

### 🔄 Recovery Planning
Provides a recovery-oriented interface for exploring ways to restore critical systems and reduce operational disruption.

### 🗺️ Campus Infrastructure Visualization
Provides a spatial view of infrastructure and institutional systems to improve understanding of campus dependencies.

### 🧪 Simulation Environment
Allows users to explore hypothetical disruption scenarios and observe their potential effects on campus operations.

### 🗄️ Database Integration
Uses Supabase for backend database services and data management.

---

## 🏗️ System Architecture

CampusGuard follows a modern web application architecture.

    User
     |
     v
    React + TypeScript Frontend
     |
     v
    Application Logic
     |
     v
    Supabase Backend
     |
     v
    PostgreSQL Database

The frontend provides the interactive dashboard, network visualization,
simulation interface, and recovery interface.

Supabase provides backend database infrastructure for storing and
managing application data.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tool |
| Tailwind CSS | Styling and responsive design |
| Supabase | Backend and database infrastructure |
| PostgreSQL | Relational database |
| Git | Version control |
| GitHub | Collaboration and repository management |
| Vercel | Application deployment |

---

## 📁 Project Structure

    CampusGuard/
    │
    ├── public/
    │   └── Static assets
    │
    ├── src/
    │   ├── components/
    │   │   └── UI components
    │   │
    │   ├── pages/
    │   │   └── Application views
    │   │
    │   ├── types/
    │   │   └── Type definitions
    │   │
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    │
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    └── README.md

---

## 🚀 Live Deployment

Live Application:

https://campusguard-ruby.vercel.app/

The application is deployed using Vercel.

---

## 💻 Running Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project directory

```bash
cd campusguard
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root and configure the Supabase credentials required by the application.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit secret credentials or service-role keys to GitHub.

### 5. Start the development server

```bash
npm run dev
```

### 6. Open the application

Open the URL displayed in the terminal, typically:

http://localhost:5173

---

## 🗄️ Database

CampusGuard uses Supabase, a backend platform built around PostgreSQL.

The database is intended to support infrastructure records, system relationships, simulation data, and application information.

Database configuration and schema management are handled through the Supabase project.

---

## 🎯 Use Cases

- Understanding interconnected campus infrastructure.
- Simulating potential system failures.
- Identifying infrastructure dependencies.
- Evaluating potential cascading disruptions.
- Exploring recovery strategies.
- Supporting institutional preparedness and continuity planning.

---

## 🔮 Future Enhancements

- AI-assisted failure prediction.
- Automated root-cause analysis.
- Real-time IoT sensor integration.
- Advanced recovery optimization.
- Historical failure analytics.
- Digital twin integration with live campus infrastructure.
- Automated emergency response recommendations.
- More realistic constraint-based simulation models.

---

## 👥 Team

Built collaboratively by a team of four students as a hackathon project.

---

## ⚠️ Disclaimer

CampusGuard is a prototype developed for demonstration and educational purposes.

Simulated infrastructure conditions and recovery recommendations should not be treated as real-world emergency response instructions or validated operational decisions.

---

## 🌟 Project Vision

CampusGuard aims to move institutional infrastructure management beyond isolated monitoring toward dependency-aware decision-making.

When a campus cannot preserve every system during a disruption, CampusGuard aims to help institutions understand what is affected, what matters most, and how continuity can be restored.

**Protecting institutional continuity through simulation, visibility, and informed decision-making.**
