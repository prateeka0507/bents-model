import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import App from './App.jsx'
import './index.css'

const Root = () => (
  <StrictMode>
    <Helmet>
      <title>Bent's Woodworking Assistant</title>
      <link rel="icon" type="image/png" href="/path-to-your-favicon.png" />
    </Helmet>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

createRoot(document.getElementById('root')).render(<Root />)
