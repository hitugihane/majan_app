import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Render the root React component into the #root element
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)