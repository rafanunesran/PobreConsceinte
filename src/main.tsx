import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// NOTE: importado por efeito colateral pra aplicar a classe `dark` no <html>
// antes do primeiro paint, independente de qual rota carrega primeiro.
import './stores/themeStore'
import { StartupError } from './components/layout/StartupError'

const root = createRoot(document.getElementById('root')!)

// NOTE: import dinâmico de propósito. App.tsx puxa (via router → authStore)
// a inicialização do Firebase, que roda no top-level do módulo — se a config
// estiver ausente/inválida, ela lança de forma síncrona durante a avaliação
// do módulo. Um `import` estático deixaria esse throw incondicional e sem
// captura possível (nem Error Boundary do React pega, porque acontece antes
// do primeiro render); um `import()` dinâmico vira uma promise rejeitada,
// que o try/catch abaixo consegue tratar com uma tela de erro legível.
async function bootstrap() {
  try {
    const { default: App } = await import('./App.tsx')
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Falha ao iniciar o app:', error)
    root.render(<StartupError error={error} />)
  }
}

bootstrap()
