import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// NOTE: importado por efeito colateral pra aplicar a classe `dark` no <html>
// antes do primeiro paint, independente de qual rota carrega primeiro.
import './stores/themeStore'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
