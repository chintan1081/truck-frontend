import { Truck, TruckHealthComponent, HealthStatus } from '../types';

export const calculateHealthScore = (truck: Truck) => {
  if (!truck || !truck.healthStatus || typeof truck.healthStatus !== 'object') return 100;
  let score = 100;
  
  // Component penalties
  Object.values(truck.healthStatus).forEach(comp => {
    if (!comp) return;
    const status = typeof comp === 'string' ? comp : comp?.status;
    if (status === 'WARNING') score -= 5;
    if (status === 'CRITICAL') score -= 15;
    if (status === 'BREAKDOWN') score -= 25;
  });

  // Tyre penalties
  if (truck.tyreDetails && Array.isArray(truck.tyreDetails)) {
    truck.tyreDetails.forEach(tyre => {
      if (tyre.condition === 'WARNING') score -= 2;
      if (tyre.condition === 'CRITICAL') score -= 8;
    });
  }

  // Service penalty (overdue)
  if (truck.odometerAtLastService && truck.serviceIntervalKm) {
    const lastService = typeof truck.odometerAtLastService === 'string' ? parseFloat(truck.odometerAtLastService) : truck.odometerAtLastService;
    const drivenSinceService = truck.currentOdometer - lastService;
    if (drivenSinceService > truck.serviceIntervalKm) score -= 10;
  }

  return Math.max(0, score);
};

export const calculateKmToService = (truck: Truck) => {
  if (!truck || !truck.odometerAtLastService || !truck.serviceIntervalKm) return null;
  const lastService = typeof truck.odometerAtLastService === 'string' ? parseFloat(truck.odometerAtLastService) : truck.odometerAtLastService;
  const nextDue = lastService + truck.serviceIntervalKm;
  return nextDue - truck.currentOdometer;
};
