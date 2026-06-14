import React, { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { api } from '../services/api/client';
import { useFormErrors, FieldRule } from '../hooks/useFormErrors';

export type QuickAddEntityType = 'client' | 'site' | 'broker' | 'route' | 'driver' | 'truck' | 'fuelSite';

interface QuickAddModalProps {
  entityType: QuickAddEntityType;
  initialName?: string;
  onClose: () => void;
  onCreated: (entity: any) => void;
}

const ENTITY_CONFIG: Record<QuickAddEntityType, { label: string; endpoint: string }> = {
  client:   { label: 'Client',       endpoint: 'clients' },
  site:     { label: 'Site',         endpoint: 'sites' },
  broker:   { label: 'Broker',       endpoint: 'brokers' },
  route:    { label: 'Route',        endpoint: 'routes' },
  driver:   { label: 'Driver',       endpoint: 'drivers' },
  truck:    { label: 'Truck',        endpoint: 'fleet' },
  fuelSite: { label: 'Fuel Station', endpoint: 'fuel-sites' },
};

const baseInputCls = `w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none
  focus:ring-4 transition-all font-semibold text-sm text-slate-800 placeholder:text-slate-400`;

const okInputCls = `${baseInputCls} border-slate-200 focus:ring-blue-500/10 focus:border-blue-400`;
const errInputCls = `${baseInputCls} border-red-300 focus:ring-red-500/10 focus:border-red-400`;

const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1';

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div>
    <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="mt-1 text-[11px] font-bold text-red-500">{error}</p>}
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
  const { errors, validate, validateField, isValid } = useFormErrors();

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

  // ---- Fuel Site ----
  const [fuelSite, setFuelSite] = useState({
    companyName: initialName, ownerName: '', phoneNumber: '', contactEmail: '',
    whatsappNumber: '', gstNumber: '', address: '', accountNumber: '',
    ifscCode: '', bankName: '', upiId: '',
  });

  /**
   * Declarative validation rules for the active entity, derived from current
   * state. Required fields have no `optional`; format-checked fields carry a
   * `type`. Used for live per-field feedback, submit-button enablement, and the
   * final submit-time check.
   */
  const buildRules = (): Record<string, FieldRule> => {
    switch (entityType) {
      case 'client':
        return {
          name:      { value: client.name, label: 'Name' },
          phone:     { value: client.phone, label: 'Phone', type: 'phone' },
          city:      { value: client.city, label: 'City' },
          gstNumber: { value: client.gstNumber, label: 'GST Number', type: 'gst', optional: true },
          email:     { value: client.email, label: 'Email', type: 'email', optional: true },
        };
      case 'site':
        return {
          name:     { value: site.name, label: 'Site Name' },
          type:     { value: site.type, label: 'Type' },
          city:     { value: site.city, label: 'City' },
          location: { value: site.location, label: 'Location / Address' },
          pincode:  { value: site.pincode, label: 'Pincode', type: 'pincode', optional: true },
        };
      case 'broker':
        return {
          name:           { value: broker.name, label: 'Name' },
          phone:          { value: broker.phone, label: 'Phone', type: 'phone' },
          email:          { value: broker.email, label: 'Email', type: 'email', optional: true },
          whatsappNumber: { value: broker.whatsappNumber, label: 'WhatsApp', type: 'phone', optional: true },
          upiId:          { value: broker.upiId, label: 'UPI ID', type: 'upi', optional: true },
        };
      case 'route':
        return {
          source:      { value: route.source, label: 'Source' },
          destination: { value: route.destination, label: 'Destination' },
          distanceKm:  { value: route.distanceKm, label: 'Distance (KM)', type: 'positiveNumber' },
        };
      case 'driver':
        return {
          name:           { value: driver.name, label: 'Full Name' },
          phoneNumber:    { value: driver.phoneNumber, label: 'Phone', type: 'phone' },
          whatsappNumber: { value: driver.whatsappNumber, label: 'WhatsApp', type: 'phone', optional: true },
          licenseExpiry:  { value: driver.licenseExpiry, label: 'License Expiry' },
          upiId:          { value: driver.upiId, label: 'UPI ID', type: 'upi', optional: true },
        };
      case 'truck':
        return {
          truckNumber:  { value: truck.truckNumber, label: 'Truck Number' },
          driverName:   { value: truck.driverName, label: 'Driver Name' },
          rcExpiry:     { value: truck.rcExpiry, label: 'RC Expiry' },
          ownerContact: { value: truck.ownerContact, label: 'Owner Contact', type: 'phone', optional: true },
          dieselLimit:  { value: truck.dieselLimit, label: 'Diesel Limit', type: 'number', min: 0, optional: true },
        };
      case 'fuelSite':
      default:
        return {
          companyName:  { value: fuelSite.companyName, label: 'Station Name' },
          phoneNumber:  { value: fuelSite.phoneNumber, label: 'Phone', type: 'phone' },
          address:      { value: fuelSite.address, label: 'Address' },
          upiId:        { value: fuelSite.upiId, label: 'UPI ID', type: 'upi', optional: true },
          contactEmail: { value: fuelSite.contactEmail, label: 'Email', type: 'email', optional: true },
        };
    }
  };

  const rules = buildRules();

  /** Updates one field in the active entity's state and re-validates it live. */
  const update = <T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    field: keyof T & string,
    value: any,
    extra?: Partial<T>
  ) => {
    setter(prev => ({ ...prev, [field]: value, ...(extra || {}) }));
    if (rules[field]) validateField(field, { ...rules[field], value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(rules)) return; // block submit until every rule passes
    setSaving(true);
    setError(null);
    try {
      let payload: any;
      if (entityType === 'client') payload = client;
      else if (entityType === 'site') payload = site;
      else if (entityType === 'broker') payload = broker;
      else if (entityType === 'route') payload = { ...route, distanceKm: Number(route.distanceKm) };
      else if (entityType === 'driver') payload = driver;
      else if (entityType === 'fuelSite') payload = fuelSite;
      else payload = truck;

      const created = await api.post(config.endpoint, payload);
      onCreated(created);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cls = (field: string) => (errors[field] ? errInputCls : okInputCls);

  const renderForm = () => {
    if (entityType === 'client') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required error={errors.name}>
          <input className={cls('name')} value={client.name} onChange={e => update(setClient, 'name', e.target.value)} placeholder="Client name" />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <input className={cls('phone')} value={client.phone} onChange={e => update(setClient, 'phone', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="City" required error={errors.city}>
          <input className={cls('city')} value={client.city} onChange={e => update(setClient, 'city', e.target.value)} placeholder="City" />
        </Field>
        <Field label="State">
          <input className={okInputCls} value={client.state} onChange={e => setClient({ ...client, state: e.target.value })} placeholder="State" />
        </Field>
        <Field label="GST Number" error={errors.gstNumber}>
          <input className={cls('gstNumber')} value={client.gstNumber} onChange={e => update(setClient, 'gstNumber', e.target.value)} placeholder="27AAPFU0939F1ZV" />
        </Field>
        <Field label="Contact Person">
          <input className={okInputCls} value={client.contactPerson} onChange={e => setClient({ ...client, contactPerson: e.target.value })} placeholder="Contact name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={cls('email')} type="email" value={client.email} onChange={e => update(setClient, 'email', e.target.value)} placeholder="email@company.com" />
        </Field>
        <Field label="Address">
          <input className={okInputCls} value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} placeholder="Street address" />
        </Field>
      </div>
    );

    if (entityType === 'site') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Site Name" required error={errors.name}>
          <input className={cls('name')} value={site.name} onChange={e => update(setSite, 'name', e.target.value)} placeholder="Site name" />
        </Field>
        <Field label="Type" required error={errors.type}>
          <select className={cls('type')} value={site.type} onChange={e => update(setSite, 'type', e.target.value)}>
            <option value="TPS">Thermal Power Station (TPS)</option>
            <option value="CLIENT_SITE">Client Site</option>
            <option value="PLANT">Plant</option>
            <option value="DEPOT">Depot</option>
          </select>
        </Field>
        <Field label="City" required error={errors.city}>
          <input className={cls('city')} value={site.city} onChange={e => update(setSite, 'city', e.target.value)} placeholder="City" />
        </Field>
        <Field label="State">
          <input className={okInputCls} value={site.state} onChange={e => setSite({ ...site, state: e.target.value })} placeholder="State" />
        </Field>
        <Field label="Location / Address" required error={errors.location}>
          <input className={cls('location')} value={site.location} onChange={e => update(setSite, 'location', e.target.value)} placeholder="Full address or landmark" />
        </Field>
        <Field label="Pincode" error={errors.pincode}>
          <input className={cls('pincode')} value={site.pincode} onChange={e => update(setSite, 'pincode', e.target.value)} placeholder="400001" />
        </Field>
      </div>
    );

    if (entityType === 'broker') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required error={errors.name}>
          <input className={cls('name')} value={broker.name} onChange={e => update(setBroker, 'name', e.target.value)} placeholder="Broker name" />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <input className={cls('phone')} value={broker.phone} onChange={e => update(setBroker, 'phone', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={cls('email')} type="email" value={broker.email} onChange={e => update(setBroker, 'email', e.target.value)} placeholder="broker@email.com" />
        </Field>
        <Field label="WhatsApp" error={errors.whatsappNumber}>
          <input className={cls('whatsappNumber')} value={broker.whatsappNumber} onChange={e => update(setBroker, 'whatsappNumber', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Address">
          <input className={okInputCls} value={broker.address} onChange={e => setBroker({ ...broker, address: e.target.value })} placeholder="Address" />
        </Field>
        <Field label="UPI ID" error={errors.upiId}>
          <input className={cls('upiId')} value={broker.upiId} onChange={e => update(setBroker, 'upiId', e.target.value)} placeholder="name@upi" />
        </Field>
      </div>
    );

    if (entityType === 'route') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source (From)" required error={errors.source}>
          <input className={cls('source')} value={route.source} onChange={e => update(setRoute, 'source', e.target.value)} placeholder="e.g. Korba TPS" />
        </Field>
        <Field label="Destination (To)" required error={errors.destination}>
          <input className={cls('destination')} value={route.destination} onChange={e => update(setRoute, 'destination', e.target.value)} placeholder="e.g. Raipur Client Site" />
        </Field>
        <Field label="Distance (KM)" required error={errors.distanceKm}>
          <input className={cls('distanceKm')} type="number" min={1} value={route.distanceKm} onChange={e => update(setRoute, 'distanceKm', e.target.value)} placeholder="250" />
        </Field>
      </div>
    );

    if (entityType === 'driver') return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <input className={cls('name')} value={driver.name} onChange={e => update(setDriver, 'name', e.target.value)} placeholder="Driver name" />
        </Field>
        <Field label="Phone" required error={errors.phoneNumber}>
          <input className={cls('phoneNumber')} value={driver.phoneNumber} onChange={e => update(setDriver, 'phoneNumber', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="WhatsApp" error={errors.whatsappNumber}>
          <input className={cls('whatsappNumber')} value={driver.whatsappNumber} onChange={e => update(setDriver, 'whatsappNumber', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="License Expiry" required error={errors.licenseExpiry}>
          <input className={cls('licenseExpiry')} type="date" value={driver.licenseExpiry} onChange={e => update(setDriver, 'licenseExpiry', e.target.value)} />
        </Field>
        <Field label="Address">
          <input className={okInputCls} value={driver.address} onChange={e => setDriver({ ...driver, address: e.target.value })} placeholder="Residential address" />
        </Field>
        <Field label="UPI ID" error={errors.upiId}>
          <input className={cls('upiId')} value={driver.upiId} onChange={e => update(setDriver, 'upiId', e.target.value)} placeholder="name@upi" />
        </Field>
      </div>
    );

    // truck
    return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Truck Number" required error={errors.truckNumber}>
          <input className={cls('truckNumber')} value={truck.truckNumber} onChange={e => update(setTruck, 'truckNumber', e.target.value, { name: e.target.value, plateNumber: e.target.value })} placeholder="MH 12 AB 1234" />
        </Field>
        <Field label="Driver Name" required error={errors.driverName}>
          <input className={cls('driverName')} value={truck.driverName} onChange={e => update(setTruck, 'driverName', e.target.value)} placeholder="Assigned driver" />
        </Field>
        <Field label="Owner Name">
          <input className={okInputCls} value={truck.ownerName} onChange={e => setTruck({ ...truck, ownerName: e.target.value })} placeholder="Owner name" />
        </Field>
        <Field label="Owner Contact" error={errors.ownerContact}>
          <input className={cls('ownerContact')} value={truck.ownerContact} onChange={e => update(setTruck, 'ownerContact', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Model">
          <input className={okInputCls} value={truck.modelNumber} onChange={e => setTruck({ ...truck, modelNumber: e.target.value, description: e.target.value })} placeholder="TATA 2518 / Ashok Leyland" />
        </Field>
        <Field label="Diesel Limit (L/day)" error={errors.dieselLimit}>
          <input className={cls('dieselLimit')} type="number" min={0} value={truck.dieselLimit} onChange={e => update(setTruck, 'dieselLimit', Number(e.target.value))} />
        </Field>
        <Field label="Insurance Expiry">
          <input className={okInputCls} type="date" value={truck.insuranceExpiry} onChange={e => setTruck({ ...truck, insuranceExpiry: e.target.value })} />
        </Field>
        <Field label="RC Expiry" required error={errors.rcExpiry}>
          <input className={cls('rcExpiry')} type="date" value={truck.rcExpiry} onChange={e => update(setTruck, 'rcExpiry', e.target.value)} />
        </Field>
      </div>
    );

    // fuelSite (default)
    return (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Station Name" required error={errors.companyName} >
          <input className={cls('companyName')} value={fuelSite.companyName} onChange={e => update(setFuelSite, 'companyName', e.target.value)} placeholder="e.g. HP Fuel Station" />
        </Field>
        <Field label="Phone" required error={errors.phoneNumber}>
          <input className={cls('phoneNumber')} value={fuelSite.phoneNumber} onChange={e => update(setFuelSite, 'phoneNumber', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Address" required error={errors.address}>
          <input className={cls('address')} value={fuelSite.address} onChange={e => update(setFuelSite, 'address', e.target.value)} placeholder="Street address" />
        </Field>
        <Field label="Owner Name">
          <input className={okInputCls} value={fuelSite.ownerName} onChange={e => setFuelSite({ ...fuelSite, ownerName: e.target.value })} placeholder="Owner name" />
        </Field>
        <Field label="UPI ID" error={errors.upiId}>
          <input className={cls('upiId')} value={fuelSite.upiId} onChange={e => update(setFuelSite, 'upiId', e.target.value)} placeholder="name@upi" />
        </Field>
        <Field label="Email" error={errors.contactEmail}>
          <input className={cls('contactEmail')} type="email" value={fuelSite.contactEmail} onChange={e => update(setFuelSite, 'contactEmail', e.target.value)} placeholder="station@email.com" />
        </Field>
      </div>
    );
  };

  const formValid = isValid(rules);

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
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
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
              disabled={saving || !formValid}
              className="flex-1 py-3 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-md shadow-amber-300/30 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
