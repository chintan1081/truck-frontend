import React from 'react';
import { DriverAuthProvider, useDriverAuth } from './services/driverAuth/DriverAuthContext';
import DriverLoginScreen from './views/driver-portal-lite/DriverLoginScreen';
import DriverDashboard from './views/driver-portal-lite/DriverDashboard';
import { ToastProvider } from './components/Toast';

const TruckDriverGate: React.FC = () => {
  const { status } = useDriverAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F5F4F0]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-bold text-sm text-slate-500 tracking-tight">Restoring your session...</span>
      </div>
    );
  }

  return status === 'authenticated' ? <DriverDashboard /> : <DriverLoginScreen />;
};

const TruckDriverApp: React.FC = () => (
  <ToastProvider>
    <DriverAuthProvider>
      <TruckDriverGate />
    </DriverAuthProvider>
  </ToastProvider>
);

export default TruckDriverApp;
