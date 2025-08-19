// src/main.jsx  (정상 완성본)

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// 선택: 흰 화면 진단용 에러 바운더리 (있어도/없어도 OK)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <pre style={{ whiteSpace: 'pre-wrap', padding: 16 }}>
          오류가 발생했습니다: {String(this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
