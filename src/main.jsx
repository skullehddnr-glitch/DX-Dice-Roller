import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
createRoot(document.getElementById('root')).render(<App />)
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error(error, info) }
  render(){
    if (this.state.hasError) {
      return <pre style={{whiteSpace:'pre-wrap', padding:16}}>
        오류가 발생했습니다: {String(this.state.error)}
      </pre>
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root'))
  .render(<ErrorBoundary><App /></ErrorBoundary>)
