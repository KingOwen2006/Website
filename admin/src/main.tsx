import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './App'
import '@site/themes/tokens.css'
import '@site/styles/experience-cms.css'
import './styles/wp-admin.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
