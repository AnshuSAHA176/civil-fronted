import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import Providers from './app/providers'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/utilities.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers><App /></Providers>
  </React.StrictMode>,
)
