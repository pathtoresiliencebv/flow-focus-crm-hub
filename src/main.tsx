import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Simple working app component
function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">App is Loading...</h1>
        <p>React is working properly</p>
      </div>
    </div>
  )
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);