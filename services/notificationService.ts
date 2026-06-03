
import { Truck, Order, Route, DriverSalary } from '../types';

/**
 * Simulates sending a professional WhatsApp message to the driver.
 */
export const sendDriverWhatsAppNotification = async (truck: Truck, order: Order, route: Route) => {
  const message = `
*FLY ASH LOGISTICS PRO - DISPATCH ALERT* 🚛

Hello ${truck.driverName}, 

A new trip has been assigned to you.
*Truck:* ${truck.truckNumber}
*Order ID:* ${order.id}
*Route:* ${route.source} ➔ ${order.projectSite}
*Quantity:* ${order.quantity} MT
*Est. Diesel:* ${order.estimatedDiesel} L

Please log in to your Driver Portal to confirm pickup.
Link: https://flyash-logistics-pro.app/driver-portal

_This is an automated dispatch notification._
  `;

  await new Promise(resolve => setTimeout(resolve, 800));
  console.log("%c[WhatsApp Sent To Driver]", "color: #25D366; font-weight: bold; font-size: 12px;");
  console.log(message);
  return true;
};

/**
 * Simulates sending a Salary Slip link to the driver.
 */
export const sendSalarySlipWhatsApp = async (salary: DriverSalary) => {
  const message = `
*FLY ASH LOGISTICS PRO - SALARY DISBURSEMENT* 💰

Hello ${salary.driverName},

Your salary for *${salary.month}* has been processed.

*Net Paid:* ₹${(salary.totalAmount || 0).toLocaleString()}
*Mode:* ${salary.paymentMode}
*Reference:* ${salary.referenceNo}

You can view and download your full salary slip here:
Link: https://flyash-logistics-pro.app/slips/${salary.id}

_Thank you for your hard work!_
  `;

  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("%c[WhatsApp Salary Sent]", "color: #25D366; font-weight: bold; font-size: 12px;");
  console.log(message);
  return true;
};

/**
 * Simulates an internal app push notification.
 */
export const sendAppNotification = (title: string, body: string) => {
  console.log(`%c[App Notification] ${title}: ${body}`, "color: #2563eb; font-weight: bold;");
};
