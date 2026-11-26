import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './App'
import {inBetaPortfolio} from './lib/public-site'
import '@site/themes/tokens.css'
import '@site/styles/experience-cms.css'
import './styles/wp-admin.css'
import './styles/beta-admin.css'

document.documentElement.classList.toggle('beta-admin', inBetaPortfolio)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
