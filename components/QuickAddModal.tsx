import React, { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { api } from '../services/api/client';

export type QuickAddEntityType = 'client' | 'site' | 'broker' | 'route' | 'driver' | 'truck';

interface QuickAddModalProps {
  entityType: QuickAddEntityType;
  initialName?: string;
  onClose: () => void;
  onCreated: (entity: any) => void;
}

const ENTITY_CONFIG: Record<QuickAddEntityType, { label: string; endpoint: string }> = {
  client:  { label: 'Client',  endpoint: 'clients' },
  site:    { label: 'Site',    endpoint: 'sites' },
  broker:  { label: 'Broker',  endpoint: 'brokers' },
  route:   { label: 'Route',   endpoint: 'routes' },
  driver:  { label: 'Driver',  endpoint: 'drivers' },
  truck:   { label: 'Truck',   endpoint: 'fleet' },
};

const inputCls = `w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none
  focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all
  font-semibold text-sm text-slate-800 placeholder:text-slate-400`;

const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1';

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
  </div>
);

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  entityType,
  initialName = '',
  onClose,
  onCreated,
}) => {
  const config = ENTITY_CONFIG[entityType];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Client ----
  const [client, setClient] = useState({
    name: initialName, phone: '', city: '', gstNumber: '', address: '', state: '',
    country: 'India', pincode: '', contactPerson: '', email: '',
  });

  // ---- Site ----
  const [site, setSite] = useState({
    name: initialName, city: '', type: 'TPS', location: '', state: '', country: 'India', pincode: '',
  });

  // ---- Broker ----
  const [broker, setBroker] = useState({
    name: initialName, phone: '', email: '', whatsappNumber: '', address: '',
    upiId: '', bankDetails: { accountNumber: '', bankName: '', ifscCode: '' },
  });

  // ---- Route ----
  const [route, setRoute] = useState({ source: '', destination: '', distanceKm: '' });

  // ---- Driver ----
  const [driver, setDriver] = useState({
    name: initialName, phoneNumber: '', whatsappNumber: '', licenseExpiry: '', address: '',
    upiId: '', bankDetails: '',
  });

  // ---- Truck ----
  const [truck, setTruck] = useState({
    truckNumber: initialName, name: initialName, driverName: '', ownerName: '', ownerContact: '',
    description: '', modelNumber: '', plateNumber: initialName, status: 'AVAILABLE',
    mileage: 0, dieselLimit: 300, totalMtHandled: 0, driverScore: 0, idleTimeHours: 0,
    engineHours: 0, currentOdometer: 0, insuranceExpiry: '', fitnessExpiry: '',
    permitExpiry: '', pollutionExpiry: '', rcExpiry: '', lastServiceDate: '',
    isMaintenanceMode: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let payload: any;
      if (entityType === 'client') payload = client;
      else if (entityType === 'site') payload = site;
      else if (entityType === 'broker') payload = broker;
      else if (entityType === 'route') payload = { ...route, distanceKm: Number(route.distanceKm) };
      else if (entityType === 'driver') payload = driver;
      else payload = truck;

      const created = await api.post(config.endpoint, payload);
      onCreated(created);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => {
    if (entityType === 'client') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required>
          <input className={inputCls} value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Client name" required />
        </Field>
        <Field label="Phone" required>
          <input className={inputCls} value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} placeholder="+91 98765 43210" required />
        </Field>
        <Field label="City" required>
          <input className={inputCls} value={client.city} onChange={e => setClient({ ...client, city: e.target.value })} placeholder="City" required />
        </Field>
        <Field label="State">
          <input className={inputCls} value={client.state} onChange={e => setClient({ ...client, state: e.target.value })} placeholder="State" />
        </Field>
        <Field label="GST Number">
          <input className={inputCls} value={client.gstNumber} onChange={e => setClient({ ...client, gstNumber: e.target.value })} placeholder="27AAPFU0939F1ZV" />
        </Field>
        <Field label="Contact Person">
          <input className={inputCls} value={client.contactPerson} onChange={e => setClient({ ...client, contactPerson: e.target.value })} placeholder="Contact name" />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} placeholder="email@company.com" />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} placeholder="Street address" />
        </Field>
      </div>
    );

    if (entityType === 'site') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Site Name" required>
          <input className={inputCls} value={site.name} onChange={e => setSite({ ...site, name: e.target.value })} placeholder="Site name" required />
        </Field>
        <Field label="Type" required>
          <select className={inputCls} value={site.type} onChange={e => setSite({ ...site, type: e.target.value })} required>
            <option value="TPS">Thermal Power Station (TPS)</option>
            <option value="CLIENT_SITE">Client Site</option>
            <option value="PLANT">Plant</option>
            <option value="DEPOT">Depot</option>
          </select>
        </Field>
        <Field label="City" required>
          <input className={inputCls} value={site.city} onChange={e => setSite({ ...site, city: e.target.value })} placeholder="City" required />
        </Field>
        <Field label="State">
          <input className={inputCls} value={site.state} onChange={e => setSite({ ...site, state: e.target.value })} placeholder="State" />
        </Field>
        <Field label="Location / Address" required>
          <input className={inputCls} value={site.location} onChange={e => setSite({ ...site, location: e.target.value })} placeholder="Full address or landmark" required />
        </Field>
        <Field label="Pincode">
          <input className={inputCls} value={site.pincode} onChange={e => setSite({ ...site, pincode: e.target.value })} placeholder="400001" />
        </Field>
      </div>
    );

    if (entityType === 'broker') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required>
          <input className={inputCls} value={broker.name} onChange={e => setBroker({ ...broker, name: e.target.value })} placeholder="Broker name" required />
        </Field>
        <Field label="Phone" required>
          <input className={inputCls} value={broker.phone} onChange={e => setBroker({ ...broker, phone: e.target.value })} placeholder="+91 98765 43210" required />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={broker.email} onChange={e => setBroker({ ...broker, email: e.target.value })} placeholder="broker@email.com" />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={broker.whatsappNumber} onChange={e => setBroker({ ...broker, whatsappNumber: e.target.value })} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={broker.address} onChange={e => setBroker({ ...broker, address: e.target.value })} placeholder="Address" />
        </Field>
        <Field label="UPI ID">
          <input className={inputCls} value={broker.upiId} onChange={e => setBroker({ ...broker, upiId: e.target.value })} placeholder="name@upi" />
        </Field>
      </div>
    );

    if (entityType === 'route') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source (From)" required>
          <input className={inputCls} value={route.source} onChange={e => setRoute({ ...route, source: e.target.value })} placeholder="e.g. Korba TPS" required />
        </Field>
        <Field label="Destination (To)" required>
          <input className={inputCls} value={route.destination} onChange={e => setRoute({ ...route, destination: e.target.value })} placeholder="e.g. Raipur Client Site" required />
        </Field>
        <Field label="Distance (KM)" required>
          <input className={inputCls} type="number" min={1} value={route.distanceKm} onChange={e => setRoute({ ...route, distanceKm: e.target.value })} placeholder="250" required />
        </Field>
      </div>
    );

    if (entityType === 'driver') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inputCls} value={driver.name} onChange={e => setDriver({ ...driver, name: e.target.value })} placeholder="Driver name" required />
        </Field>
        <Field label="Phone" required>
          <input className={inputCls} value={driver.phoneNumber} onChange={e => setDriver({ ...driver, phoneNumber: e.target.value })} placeholder="+91 98765 43210" required />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={driver.whatsappNumber} onChange={e => setDriver({ ...driver, whatsappNumber: e.target.value })} placeholder="+91 98765 43210" />
        </Field>
        <Field label="License Expiry" required>
          <input className={inputCls} type="date" value={driver.licenseExpiry} onChange={e => setDriver({ ...driver, licenseExpiry: e.target.value })} required />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={driver.address} onChange={e => setDriver({ ...driver, address: e.target.value })} placeholder="Residential address" />
        </Field>
        <Field label="UPI ID">
          <input className={inputCls} value={driver.upiId} onChange={e => setDriver({ ...driver, upiId: e.target.value })} placeholder="name@upi" />
        </Field>
      </div>
    );

    // truck
    return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Truck Number" required>
          <input className={inputCls} value={truck.truckNumber} onChange={e => setTruck({ ...truck, truckNumber: e.target.value, name: e.target.value, plateNumber: e.target.value })} placeholder="MH 12 AB 1234" required />
        </Field>
        <Field label="Driver Name" required>
          <input className={inputCls} value={truck.driverName} onChange={e => setTruck({ ...truck, driverName: e.target.value })} placeholder="Assigned driver" required />
        </Field>
        <Field label="Owner Name">
          <input className={inputCls} value={truck.ownerName} onChange={e => setTruck({ ...truck, ownerName: e.target.value })} placeholder="Owner name" />
        </Field>
        <Field label="Owner Contact">
          <input className={inputCls} value={truck.ownerContact} onChange={e => setTruck({ ...truck, ownerContact: e.target.value })} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Model">
          <input className={inputCls} value={truck.modelNumber} onChange={e => setTruck({ ...truck, modelNumber: e.target.value, description: e.target.value })} placeholder="TATA 2518 / Ashok Leyland" />
        </Field>
        <Field label="Diesel Limit (L/day)">
          <input className={inputCls} type="number" min={0} value={truck.dieselLimit} onChange={e => setTruck({ ...truck, dieselLimit: Number(e.target.value) })} />
        </Field>
        <Field label="Insurance Expiry">
          <input className={inputCls} type="date" value={truck.insuranceExpiry} onChange={e => setTruck({ ...truck, insuranceExpiry: e.target.value })} />
        </Field>
        <Field label="RC Expiry">
          <input className={inputCls} type="date" value={truck.rcExpiry} onChange={e => setTruck({ ...truck, rcExpiry: e.target.value })} />
        </Field>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 flex items-center justify-center shadow-sm">
              <Plus size={18} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Quick Add</p>
              <h3 className="text-lg font-black text-slate-800 leading-tight">New {config.label}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-slate-50 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {renderForm()}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-slate-200 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-md shadow-amber-300/30 hover:bg-amber-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
              {saving ? 'Saving...' : `Add ${config.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
