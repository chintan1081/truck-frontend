
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import TruckDriverApp from './TruckDriverApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/services/auth/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// The truck-driver portal is a fully separate app tree with its own auth —
// branching here (before either tree mounts) avoids nesting a second
// BrowserRouter inside the admin app's own <Router>.
const isDriverPortal = window.location.pathname.startsWith('/truck');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isDriverPortal ? (
        <TruckDriverApp />
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
