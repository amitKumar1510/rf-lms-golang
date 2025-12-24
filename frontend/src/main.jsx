import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import { store } from "./store/store"
import { AppThemeProvider } from "./theme/ThemeManager"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
