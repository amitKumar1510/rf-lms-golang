import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { CssBaseline, ThemeProvider } from "@mui/material"
import './index.css'
import App from './App.jsx'
import { store } from "./store/store"
import { theme } from "./theme/theme"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
