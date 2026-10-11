import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/authContext.jsx'
import { ProModalProvider } from './lib/proModal.jsx'
import { ConfirmProvider } from './lib/confirmDialog.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* На GitHub Pages сайт живёт в подпапке (base в vite.config.js) — без
        basename ни один маршрут не совпал бы. В dev BASE_URL = '/'. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ProModalProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ProModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
