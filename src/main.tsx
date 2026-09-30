import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EquiposProvider } from './context/EquipoContext.tsx'


createRoot(document.getElementById('root')!).render(
  <EquiposProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </EquiposProvider>

)
