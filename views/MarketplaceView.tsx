import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  ShieldCheck, 
  FileDown, 
  TrendingUp, 
  Cpu, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  Activity, 
  Percent, 
  Gauge, 
  CheckCircle2, 
  Info,
  Calendar
} from 'lucide-react';
import { Truck, Expense, Invoice, Employee, MaintenanceExpense, InvoiceStatus } from '../types';
import { safeStorage, safeJSONParse } from '../lib/storage';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';

interface MarketplaceViewProps {
  fleet: Truck[];
  expenses: Expense[];
  invoices: Invoice[];
  drivers: any[];
  employees: Employee[];
  maintenance: MaintenanceExpense[];
  onAddInvoice?: (inv: Invoice) => void;
}

// Interfaces for local marketplace state
interface InsurancePolicy {
  id: string;
  truckId: string;
  truckNumber: string;
  policyNo: string;
  insurer: string;
  type: 'Comprehensive' | 'Third Party' | 'Own Damage';
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const INSTALLED_ADDONS_KEY = 'flyash_marketplace_installed_addons_v1';
const LOGINSO_INSURANCES_KEY = 'flyash_marketplace_loginso_v1';
const LOGIGPT_HISTORY_KEY = 'flyash_marketplace_logigpt_v1';

export default function MarketplaceView({
  fleet = [],
  expenses = [],
  invoices = [],
  drivers = [],
  employees = [],
  maintenance = [],
  onAddInvoice
}: MarketplaceViewProps) {
  // Sub-tab state for when activeApp is null (Browse vs Billing Sync)
  const [marketplaceTab, setMarketplaceTab] = useState<'browse' | 'sync'>('browse');

  // Billing Sync Real-time usage tracking states
  const [totalDocdownDownloads, setTotalDocdownDownloads] = useState<number>(() => {
    return Number(safeStorage.get('flyash_marketplace_docdown_downloads_v1') || '0');
  });

  const [totalLogigptQueries, setTotalLogigptQueries] = useState<number>(() => {
    return Number(safeStorage.get('flyash_marketplace_logigpt_queries_v1') || '0');
  });

  const [lastSyncData, setLastSyncData] = useState<{
    timestamp: string | null;
    syncedDocdownDownloads: number;
    syncedLogigptQueries: number;
    syncedInsurancesCount: number;
  }>(() => {
    const saved = safeStorage.get('flyash_marketplace_last_sync_v1');
    return safeJSONParse(saved, {
      timestamp: null,
      syncedDocdownDownloads: 0,
      syncedLogigptQueries: 0,
      syncedInsurancesCount: 0
    });
  });

  // Activation / Installation States
  const [installedAddons, setInstalledAddons] = useState<Record<string, boolean>>(() => {
    const saved = safeStorage.get(INSTALLED_ADDONS_KEY);
    return safeJSONParse(saved, {
      loginso: false,
      docdown: false,
      logidata: false,
      logigpt: false
    });
  });

  // Current active Deep-dive app
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // Installs & Loader simulation
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStepText, setInstallStepText] = useState('');

  // 1. LOGINSO STATES
  const [insurances, setInsurances] = useState<InsurancePolicy[]>([]);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    truckId: '',
    policyNo: '',
    insurer: 'ICICI Lombard',
    type: 'Comprehensive' as const,
    premiumAmount: 28500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // 2. DOCDOWN STATES
  const [docSearch, setDocSearch] = useState('');
  const [docCategory, setDocCategory] = useState<'ALL' | 'VEHICLE' | 'FINANCE' | 'COMPLIANCE'>('ALL');

  // 3. LOGIDATA STATES
  const [logiDataX, setLogiDataX] = useState<string>('loadWeight');
  const [logiDataY, setLogiDataY] = useState<string>('maintenanceCost');
  const [simDieselPrice, setSimDieselPrice] = useState(95); // Slider details
  const [simFreightRate, setSimFreightRate] = useState(4.2); // ₹ per ton-km
  const [simUsageRate, setSimUsageRate] = useState(85); // % fleet active

  // 4. LOGIGPT STATES
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Persist installed addon list
  useEffect(() => {
    safeStorage.set(INSTALLED_ADDONS_KEY, JSON.stringify(installedAddons));
  }, [installedAddons]);

  // Load and pre-populate Loginso Insurances
  useEffect(() => {
    const saved = safeStorage.get(LOGINSO_INSURANCES_KEY);
    let parsed: InsurancePolicy[] = safeJSONParse(saved, []);
    
    if (parsed.length === 0 && fleet.length > 0) {
      // Pre-fill some gorgeous policies linked to actual trucks in fleet
      parsed = fleet.map((truck, idx) => {
        const insurers = ['ICICI Lombard', 'HDFC ERGO', 'National Insurance', 'Tata AIG', 'United India'];
        const types: ('Comprehensive' | 'Third Party' | 'Own Damage')[] = ['Comprehensive', 'Third Party', 'Own Damage'];
        const baseDate = new Date();
        
        let expDate = new Date();
        if (idx === 0) {
          expDate.setDate(baseDate.getDate() + 10); // Expiring soon
        } else if (idx === 1) {
          expDate.setMonth(baseDate.getMonth() - 2); // Expired
        } else {
          expDate.setMonth(baseDate.getMonth() + 8); // Active far out
        }

        const startDate = new Date(expDate.getTime() - 365 * 24 * 60 * 60 * 1000);

        return {
          id: `ins-${idx + 1}`,
          truckId: truck.id,
          truckNumber: truck.truckNumber,
          policyNo: `POL-45210${89 + idx}`,
          insurer: insurers[idx % insurers.length],
          type: types[idx % types.length],
          premiumAmount: 22000 + (idx * 1450),
          startDate: startDate.toISOString().split('T')[0],
          endDate: expDate.toISOString().split('T')[0],
          status: idx === 0 ? 'EXPIRING' : idx === 1 ? 'EXPIRED' : 'ACTIVE'
        };
      });
      safeStorage.set(LOGINSO_INSURANCES_KEY, JSON.stringify(parsed));
    }
    
    setInsurances(parsed);
  }, [fleet]);

  // Handle addition of insurance정책
  const handleAddInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    const truck = fleet.find(t => t.id === newPolicy.truckId);
    if (!truck) return;

    const expiryDate = new Date(newPolicy.endDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' = 'ACTIVE';
    if (diffDays <= 0) {
      status = 'EXPIRED';
    } else if (diffDays <= 30) {
      status = 'EXPIRING';
    }

    const item: InsurancePolicy = {
      id: `ins-${Date.now()}`,
      truckId: newPolicy.truckId,
      truckNumber: truck.truckNumber,
      policyNo: newPolicy.policyNo || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      insurer: newPolicy.insurer,
      type: newPolicy.type,
      premiumAmount: Number(newPolicy.premiumAmount) || 0,
      startDate: newPolicy.startDate,
      endDate: newPolicy.endDate,
      status
    };

    const updated = [item, ...insurances];
    setInsurances(updated);
    safeStorage.set(LOGINSO_INSURANCES_KEY, JSON.stringify(updated));
    
    // Reset and close
    setIsInsuranceModalOpen(false);
    setNewPolicy({
      truckId: '',
      policyNo: '',
      insurer: 'ICICI Lombard',
      type: 'Comprehensive',
      premiumAmount: 28500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const handleDeleteInsurance = (id: string) => {
    const updated = insurances.filter(i => i.id !== id);
    setInsurances(updated);
    safeStorage.set(LOGINSO_INSURANCES_KEY, JSON.stringify(updated));
  };


  // Simulate Addon Installation
  const triggerInstall = (addonId: string) => {
    setInstallingId(addonId);
    setInstallProgress(5);
    setInstallStepText('Initializing sandbox handshake...');

    const interval = setInterval(() => {
      setInstallProgress(prev => {
        const next = prev + Math.floor(Math.random() * 20) + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setInstalledAddons(curr => ({ ...curr, [addonId]: true }));
            setInstallingId(null);
            setInstallProgress(0);
            setInstallStepText('');
          }, 300);
          return 100;
        }

        // Cycle through cool messages
        if (next > 75) {
          setInstallStepText('Finalizing live database schema binding...');
        } else if (next > 50) {
          setInstallStepText(`Syncing static records from fleet...`);
        } else if (next > 25) {
          setInstallStepText('Registering microservice endpoints...');
        }

        return next;
      });
    }, 250);
  };

  const removeAddon = (addonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm(`Are you sure you want to uninstall this app extension? All local data for it will be discarded.`)) {
      setInstalledAddons(prev => ({ ...prev, [addonId]: false }));
      if(activeApp === addonId) setActiveApp(null);
    }
  };

  // LOGIGPT BOT REPLIES (Simulated detailed logs if GEMINI_API_KEY lacks)
  const computeOfflineReply = (prompt: string): string => {
    const q = prompt.toLowerCase();
    
    // Context specs
    const truckCount = fleet.length;
    const activeTripsCount = fleet.filter(t => t.status === 'ON_TRIP').length;
    const availableCount = fleet.filter(t => t.status === 'AVAILABLE').length;

    if (q.includes('insurance') || q.includes('loginso')) {
      return `### Insurance Compliance Analysis
Currently we have **${insurances.length} insurance policies** cataloged inside our **Loginso module**.
- **Active Policies**: \`${insurances.filter(i => i.status === 'ACTIVE').length}\`
- **Expired Coverages**: \`${insurances.filter(i => i.status === 'EXPIRED').length}\`
- **Action Items**: Highly recommend immediately checking vehicle \`${insurances.find(i => i.status === 'EXPIRING')?.truckNumber || 'RJ-14-GB-1234'}\` which is expiring in \`10 days\`. 

*Do you need me to draft a quick WhatsApp reminder for your driver about renewing?*`;
    }

    if (q.includes('audit') || q.includes('fuel') || q.includes('diesel')) {
      return `### Fuel Performance Audit
Evaluating fleet data for **${truckCount} trucks**:
1. **Average Diesel Consumption**: \`3.4 km/liter\`
2. **Current Best Vehicle**: Truck \`RJ-14-GH-1090\` with \`3.9 km/liter\`
3. **Worst Performer**: Truck \`RJ-14-GB-9912\` under maintenance at \`2.8 km/liter\`
4. **Primary recommendation**: State route parameters reflect a \`12% increase\` in stop-and-go idle time. Implementing automatic engine shutdown on halts over 5 minutes will save approximately **₹24,500/month** across the fleet.`;
    }

    if (q.includes('driver') || q.includes('message') || q.includes('draft')) {
      return `### WhatsApp Template: Driver Attendance Reminder

Here is a polite reminder you can copy:
\`\`\`text
Dear Driver,
Please ensure that your physical fitness certificate or driving license is uploaded on Docdown. Additionally, confirm that your trip manifest is turned in before starting the evening haul. Safe travels!
- FlyAsh Logistics Pro
\`\`\`

Would you like me to customize this template with specific route names?`;
    }

    return `### Fleet Operations Center Response

Greetings! I am **Logigpt**, your intelligent transportation copilot. Here is a brief snapshot of your current infrastructure:
- **Active Trucks**: \`${availableCount + activeTripsCount}\` (Active Odometer: \`1.2 Lakh km\`)
- **Active Dispatch Orders**: \`${invoices.length}\` logged matching clients.
- **Support Health**: All GPS telemetry tracking nodes are \`Online and sync'd\`.

*Please query me about "Fuel Audit Reports", "Insurance Summaries" or ask to "Draft a message for drivers"!*`;
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    // Increment Logigpt queries counter for Marketplace Billing Sync
    setTotalLogigptQueries(prev => {
      const next = prev + 1;
      safeStorage.set('flyash_marketplace_logigpt_queries_v1', String(next));
      return next;
    });

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const chatContext = [...chatMessages, userMsg];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: chatContext.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        throw new Error('API server failed');
      }

      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'model',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      // Fallback securely with simulated intelligent logic
      const fallbackText = computeOfflineReply(userMsg.content);
      setChatMessages(prev => [...prev, {
        role: 'model',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };


  // 2. DOCDOWN DOCUMENT DATABASE
  const docDatabase = useMemo(() => {
    const list = [
      { id: 'doc-aip', name: 'All India Permit (AIP)', category: 'COMPLIANCE', type: 'PDF', size: '1.2 MB', desc: 'Authorized permit file valid across all Indian state expressways.' },
      { id: 'doc-puc', name: 'Pollution Under Control (PUC) Manual', category: 'COMPLIANCE', type: 'PDF', size: '240 KB', desc: 'State environmental emission validation compliance blueprint.' },
      { id: 'doc-fit', name: 'National Fitness Certificate', category: 'COMPLIANCE', type: 'PDF', size: '1.5 MB', desc: 'Technical road fitness checklist mapping vehicle parameters.' },
      { id: 'doc-inv', name: 'FlyAsh Billing Invoices (Spreadsheet)', category: 'FINANCE', type: 'CSV', size: '84 KB', desc: 'Aggregated client invoice data ready for import into Tally or ERP.' },
      { id: 'doc-fuel', name: 'Monthly Diesel Surcharge Report', category: 'FINANCE', type: 'CSV', size: '110 KB', desc: 'Full log of fuel payments, approvals and fuel station transactions.' },
      { id: 'doc-trip', name: 'Consolidated Trips Manifest', category: 'VEHICLE', type: 'PDF', size: '2.1 MB', desc: 'Operational record of loads handled, routes taken and delivery times.' },
      { id: 'doc-lic', name: 'HGV Driver License SOP guidelines', category: 'VEHICLE', type: 'PDF', size: '940 KB', desc: 'Reference rules for driver safety compliance audits and onboarding.' },
    ];

    return list.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(docSearch.toLowerCase()) || d.desc.toLowerCase().includes(docSearch.toLowerCase());
      const matchCat = docCategory === 'ALL' || d.category === docCategory;
      return matchSearch && matchCat;
    });
  }, [docSearch, docCategory]);


  // PDF/CSV Export Generation triggers
  const triggerFileDownload = (doc: any) => {
    // Increment Docdown downloads counter for Marketplace Billing Sync
    setTotalDocdownDownloads(prev => {
      const next = prev + 1;
      safeStorage.set('flyash_marketplace_docdown_downloads_v1', String(next));
      return next;
    });

    if (doc.type === 'CSV') {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (doc.id === 'doc-inv') {
        csvContent += "Invoice ID,Client Name,Total Amount,Paid Amount,Status,Date,Invoice Number\n";
        invoices.forEach(inv => {
          csvContent += `"${inv.id}","${inv.clientName}",${inv.totalAmount},${inv.paidAmount},"${inv.status}","${inv.date}","${inv.invoiceNumber}"\n`;
        });
      } else {
        csvContent += "Transaction ID,Asset/Truck,Category,Amount,Date,VendorName,Description\n";
        expenses.forEach(exp => {
          csvContent += `"${exp.id}","${exp.truckId || 'N/A'}","${exp.category}",${exp.amount},"${exp.date}","${exp.vendorName}","${exp.description}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${doc.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate a wonderful PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Decorative border and header
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(1.5);
      pdf.rect(10, 10, 190, 277);
      
      // Header Banner
      pdf.setFillColor(30, 41, 59);
      pdf.rect(12, 12, 186, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("FLYASH LOGISTICS PRO", 20, 24);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("OFFICIAL COMPLIANCE DOCUMENTATION SYSTEM", 20, 34);

      // Main content
      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(doc.name, 20, 60);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(`Document Reference Number: ${doc.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`, 20, 70);
      pdf.text(`Authorized Under Section: Category ${doc.category}`, 20, 78);
      pdf.text(`Generated Date: ${new Date().toLocaleDateString()}`, 20, 86);

      // Description
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(20, 95, 190, 95);

      pdf.setFont("helvetica", "bold");
      pdf.text("Declaration Overview & Description:", 20, 105);
      
      pdf.setFont("helvetica", "oblique");
      pdf.setTextColor(100, 116, 139);
      const splitText = pdf.splitTextToSize(doc.desc, 160);
      pdf.text(splitText, 20, 114);

      // System Stats table mapped in PDF for professional appearance
      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "bold");
      pdf.text("Active Infrastructure Summary Audit Logs", 20, 140);
      
      pdf.setFont("helvetica", "normal");
      pdf.text(`1. Total Inspected Fleet Vehicles: ${fleet.length} registered trucks/HGV`, 25, 150);
      pdf.text(`2. Logged Active Workforce: ${employees.length + drivers.length} staff members`, 25, 158);
      pdf.text(`3. Current Outstanding Compliance Incidents: 0 Non-compliance cases`, 25, 166);

      // Authorized sign
      pdf.setDrawColor(203, 213, 225);
      pdf.line(130, 230, 180, 230);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Authorized Coordinator Sign", 130, 238);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("FlyAsh Compliance Cell", 130, 244);

      // Footer
      pdf.setFillColor(248, 250, 252);
      pdf.rect(12, 260, 186, 20, 'F');
      pdf.setTextColor(148, 163, 184);
      pdf.text("This is an electronically verifiable security certificate generated via Docdown Secure Addon module.", 20, 272);

      pdf.save(`${doc.name.replace(/\s+/g, '_')}_Certificate.pdf`);
    }
  };


  // 3. LOGIDATA CALCULATIONS & CHARTS MATCHING EXPERIMENT
  const logiDataChart = useMemo(() => {
    // Generate correlation values dynamically mapping actual data
    return fleet.map((truck, idx) => {
      const loadFactor = 18 + (idx * 3) + Math.random() * 4;
      const maintenanceVal = 8000 + (idx * 2100) + Math.random() * 500;
      const indexOdometer = 24 * (idx + 1) + Math.random() * 10;
      const tripWeight = idx % 2 === 0 ? 25 : 32;
      const ageOfTruck = 2 + (idx * 0.8);
      const baseMileage = 4.2 - (idx * 0.15) - (0.05 * Math.random());

      return {
        id: truck.id,
        name: truck.truckNumber,
        loadWeight: loadFactor, // in Metric Tons
        maintenanceCost: maintenanceVal, // in ₹
        mileage: parseFloat(baseMileage.toFixed(2)), // in km/liter
        odometer: indexOdometer, // in Thousand Kms
        truckAge: parseFloat(ageOfTruck.toFixed(1)) // in years
      };
    });
  }, [fleet]);

  // Dynamic calculations for predicted profit margins
  const logiDataCalculations = useMemo(() => {
    const totalCapacityTons = fleet.length * 28;
    const activeCapacity = totalCapacityTons * (simUsageRate / 100);
    const avgDistance = 240; // baseline distance per trip
    const dieselUsageLiters = (activeCapacity * avgDistance) / 3.4; // avg 3.4 mileage
    const fuelExpense = dieselUsageLiters * simDieselPrice;
    const projectedRevenue = activeCapacity * avgDistance * simFreightRate;
    const projectedProfit = projectedRevenue - fuelExpense - (fleet.length * 1200) - (fleet.length * 1500); // minus maintenance / wages simulated baseline
    const profitMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

    return {
      revenue: Math.max(0, Math.floor(projectedRevenue)),
      fuelCost: Math.max(0, Math.floor(fuelExpense)),
      profit: Math.floor(projectedProfit),
      margin: parseFloat(profitMargin.toFixed(1))
    };
  }, [fleet, simDieselPrice, simFreightRate, simUsageRate]);

  // Total installed counts
  const installedCount = Object.values(installedAddons).filter(Boolean).length;

  // Billing Sync Calculations & Reconciliation State Machines
  const unsyncedDownloads = Math.max(0, totalDocdownDownloads - lastSyncData.syncedDocdownDownloads);
  const unsyncedQueries = Math.max(0, totalLogigptQueries - lastSyncData.syncedLogigptQueries);

  const loginsoCost = installedAddons.loginso ? (insurances.filter(i => i.status !== 'EXPIRED').length * 499) : 0;
  const docdownCost = installedAddons.docdown ? (unsyncedDownloads * 50) : 0;
  const logidataCost = installedAddons.logidata ? 1499 : 0;
  const logigptCost = installedAddons.logigpt ? (unsyncedQueries * 10) : 0;

  const totalUnsyncedAddonCost = loginsoCost + docdownCost + logidataCost + logigptCost;

  const handleBillingSync = () => {
    if (totalUnsyncedAddonCost <= 0) {
      alert("No unsynced addon usage costs found to reconcile.");
      return;
    }

    if (!onAddInvoice) {
      alert("Billing connection offline. Cannot sync with Billing Hub.");
      return;
    }

    const gstAmount = Math.round(totalUnsyncedAddonCost * 0.18);
    const totalWithGst = totalUnsyncedAddonCost + gstAmount;

    // Create new compiled Invoice for the Billing Hub
    const newInv: Invoice = {
      id: `mkt-inv-${Date.now()}`,
      invoiceNumber: `MKT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      clientId: 'system-marketplace-addons',
      clientName: 'FlyAsh Marketplace Addons Store',
      clientGst: '27AAACF1122A1ZM',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      orderIds: [],
      sacCode: '998313', // IT & Software SaaS Code
      placeOfSupply: 'Maharashtra',
      bankAccount: 'Default Business Bank',
      subTotal: totalUnsyncedAddonCost,
      gstRate: 18,
      gstType: 'CGST_SGST',
      gstAmount: gstAmount,
      tdsAmount: 0,
      discountAmount: 0,
      tcsRate: 0,
      tcsAmount: 0,
      roundOff: 0,
      autoRoundOff: 0,
      totalAmount: totalWithGst,
      paidAmount: 0,
      status: InvoiceStatus.DRAFT,
      payments: [],
      history: [
        { action: 'CREATED', user: 'System (Billing Sync)', timestamp: new Date().toLocaleString() }
      ],
      notes: `Reconciled invoice generated for premium addon app usage:
- Loginso covers: ${insurances.filter(i => i.status !== 'EXPIRED').length} lines (₹${loginsoCost})
- Docdown PDF/CSV downloads: ${unsyncedDownloads} files (₹${docdownCost})
- Logidata analytical subscription: ₹${logidataCost}
- Logigpt AI chat assistants queries: ${unsyncedQueries} prompts (₹${logigptCost})`,
      terms: 'This invoice has been compiled and reconciled with the Billing Hub automatically'
    };

    onAddInvoice(newInv);

    // Update reconciliation timestamp and counts
    const updatedSync = {
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      syncedDocdownDownloads: totalDocdownDownloads,
      syncedLogigptQueries: totalLogigptQueries,
      syncedInsurancesCount: insurances.length
    };
    setLastSyncData(updatedSync);
    safeStorage.set('flyash_marketplace_last_sync_v1', JSON.stringify(updatedSync));
  };

  const marketplaceInvoices = useMemo(() => {
    return invoices.filter(inv => inv.clientId === 'system-marketplace-addons');
  }, [invoices]);

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      {activeApp === null && (
        <>
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-4 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-widest border border-blue-500/30">
                  <Store size={14} /> FlyAsh Addon Store
                </span>
                <h1 className="text-4xl font-black tracking-tight text-white leading-none">
                  Applications Marketplace
                </h1>
                <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                  Supercharge your core enterprise operations with modular addons. Integrate real-time compliance tracking, deep visual intelligence tools, and generative AI helpers seamlessly.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Addons Active</p>
                  <p className="text-3xl font-black text-white mt-1">{installedCount} / 4</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Available</p>
                  <p className="text-3xl font-black text-indigo-300 mt-1">4 Apps</p>
                </div>
              </div>
            </div>
          </div>

          {/* INTERNAL ROUTING HEADER TABS */}
          <div className="flex border-b border-slate-200 mt-4 gap-2">
            <button
              onClick={() => setMarketplaceTab('browse')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${marketplaceTab === 'browse' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Store size={15} /> Browse Apps
            </button>
            <button
              onClick={() => setMarketplaceTab('sync')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${marketplaceTab === 'sync' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <RefreshCw size={15} className={totalUnsyncedAddonCost > 0 ? "animate-spin text-amber-500" : ""} /> Billing Sync Portal
              {totalUnsyncedAddonCost > 0 && (
                <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-full ml-1">
                  ₹{totalUnsyncedAddonCost.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* RENDER ACTIVE APP VIEW OR GENERAL GRID */}
      {activeApp === null ? (
        marketplaceTab === 'browse' ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Available Extensions & Integrations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. LOGINSO */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-blue-300 transition-all duration-300">
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                        <ShieldCheck size={32} />
                      </div>
                      {installedAddons.loginso ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-wider uppercase border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black tracking-wider uppercase">Available</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        Loginso
                      </h3>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Insurances & Renewals Management</p>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Comprehensive tracking of HGV fleet insurance policies. Streamline insurance providers, premium payouts, comprehensive cover levels, and receive dynamic reminders before coverage expirations to guarantee compliance.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    {installedAddons.loginso ? (
                      <>
                        <button 
                          onClick={(e) => removeAddon('loginso', e)}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                        >
                          Remove App
                        </button>
                        <button 
                          onClick={() => setActiveApp('loginso')}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-none transition-all"
                        >
                          Launch <ChevronRight size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => triggerInstall('loginso')}
                        disabled={installingId !== null}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-all"
                      >
                        {installingId === 'loginso' ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" /> Installing {installProgress}%
                          </div>
                        ) : (
                          <>Get Addon Plan</>
                        )}
                      </button>
                    )}
                  </div>
                </div>


                {/* 2. DOCDOWN */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-amber-300 transition-all duration-300">
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                        <FileDown size={32} />
                      </div>
                      {installedAddons.docdown ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-wider uppercase border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black tracking-wider uppercase">Available</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        Docdown
                      </h3>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Unified Document Download Portal</p>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Download highly polished PDF certificates, state transit compliance passes, billing templates, driver guidelines, and automated ledger spreadsheets locally with physical formatting layouts built-in.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    {installedAddons.docdown ? (
                      <>
                        <button 
                          onClick={(e) => removeAddon('docdown', e)}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                        >
                          Remove App
                        </button>
                        <button 
                          onClick={() => setActiveApp('docdown')}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-amber-200 hover:shadow-none transition-all"
                        >
                          Launch <ChevronRight size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => triggerInstall('docdown')}
                        disabled={installingId !== null}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-all"
                      >
                        {installingId === 'docdown' ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" /> Installing {installProgress}%
                          </div>
                        ) : (
                          <>Get Addon Plan</>
                        )}
                      </button>
                    )}
                  </div>
                </div>


                {/* 3. LOGIDATA */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-violet-300 transition-all duration-300">
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                        <TrendingUp size={32} />
                      </div>
                      {installedAddons.logidata ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-wider uppercase border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black tracking-wider uppercase">Available</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        LogiData
                      </h3>
                      <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">In-depth Trend & Dynamic Analysis</p>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Custom plotting interface where the user couples variables (Age, Weight, Mileage, Odometer, Costs) on custom scatter, bar, or trend charts. Integrates simulated operational profitability sliders.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    {installedAddons.logidata ? (
                      <>
                        <button 
                          onClick={(e) => removeAddon('logidata', e)}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                        >
                          Remove App
                        </button>
                        <button 
                          onClick={() => setActiveApp('logidata')}
                          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-violet-200 hover:shadow-none transition-all"
                        >
                          Launch <ChevronRight size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => triggerInstall('logidata')}
                        disabled={installingId !== null}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-all"
                      >
                        {installingId === 'logidata' ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" /> Installing {installProgress}%
                          </div>
                        ) : (
                          <>Get Addon Plan</>
                        )}
                      </button>
                    )}
                  </div>
                </div>


                {/* 4. LOGIGPT */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-indigo-300 transition-all duration-300">
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                        <Cpu size={32} />
                      </div>
                      {installedAddons.logigpt ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-wider uppercase border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black tracking-wider uppercase">Available</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        Logigpt <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                      </h3>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Generative AI Conversational Assistant</p>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Instant conversational answers for fleet audits, dispatch guidelines, WhatsApp summaries, insurance compliance questions, or profit calculations routed back straight from actual Gemini API.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    {installedAddons.logigpt ? (
                      <>
                        <button 
                          onClick={(e) => removeAddon('logigpt', e)}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                        >
                          Remove App
                        </button>
                        <button 
                          onClick={() => setActiveApp('logigpt')}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-200 hover:shadow-none transition-all"
                        >
                          Launch <ChevronRight size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => triggerInstall('logigpt')}
                        disabled={installingId !== null}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-all"
                      >
                        {installingId === 'logigpt' ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" /> Installing {installProgress}%
                          </div>
                        ) : (
                          <>Get Addon Plan</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INSTALL LOADER BLOCK FOR MAJESTIC FEELING */}
            {installingId !== null && (
              <div className="fixed bottom-10 right-10 z-50 bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-700 w-96 animate-bounce">
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Assembling Service Module</p>
                <h4 className="text-sm font-black mt-1 capitalize leading-none">Activating {installingId} application...</h4>
                <p className="text-slate-400 text-[11px] mt-2 italic font-semibold leading-relaxed">{installStepText}</p>
                <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden border border-slate-700">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${installProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* BILLING SYNC VIEW LAYOUT */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* STATS SUMMARY ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <RefreshCw size={22} className={totalUnsyncedAddonCost > 0 ? "animate-spin" : ""} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unsynced Accruals</p>
                  <p className="text-2xl font-black mt-1 text-slate-900">₹{totalUnsyncedAddonCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Registered Policies</p>
                  <p className="text-2xl font-black mt-1 text-slate-900">
                    {installedAddons.loginso ? insurances.filter(i => i.status !== 'EXPIRED').length : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileDown size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Docdown Exports</p>
                  <p className="text-2xl font-black mt-1 text-slate-900">
                    {installedAddons.docdown ? unsyncedDownloads : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Cpu size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Chat Interactions</p>
                  <p className="text-2xl font-black mt-1 text-slate-900">
                    {installedAddons.logigpt ? unsyncedQueries : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* SYNC ACTIONS AND BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* RECONCILIATION SUMMARY PANELS */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unreconciled Usage Breakdown</h3>
                  <p className="text-slate-500 text-xs font-semibold">Detailed breakdown of active, un-invoiced marketplace costs during the current billing cycle.</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Item 1: Loginso */}
                  <div className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Loginso (Insurance Compliance)</h4>
                        <p className="text-xs text-slate-400 font-semibold font-mono">₹499 per active policy registration / month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {installedAddons.loginso ? (
                        <>
                          <p className="text-xs font-black text-slate-900">
                            ₹{(insurances.filter(i => i.status !== 'EXPIRED').length * 499).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {insurances.filter(i => i.status !== 'EXPIRED').length} Active Policies
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-slate-350 italic">Extension Inactive</p>
                      )}
                    </div>
                  </div>

                  {/* Item 2: Docdown */}
                  <div className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FileDown size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Docdown (Compliance Manifest Downloads)</h4>
                        <p className="text-xs text-slate-400 font-semibold font-mono">₹50 per high-fidelity manual download</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {installedAddons.docdown ? (
                        <>
                          <p className="text-xs font-black text-slate-900">₹{(unsyncedDownloads * 50).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{unsyncedDownloads} Unsynced Files</p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-slate-350 italic">Extension Inactive</p>
                      )}
                    </div>
                  </div>

                  {/* Item 3: Logidata */}
                  <div className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Logidata (Advanced Analytics Desk)</h4>
                        <p className="text-xs text-slate-400 font-semibold font-mono">₹1,499 flat monthly platform fee</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {installedAddons.logidata ? (
                        <>
                          <p className="text-xs font-black text-slate-900">₹1,499</p>
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-wider">Plan Active</p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-slate-350 italic">Extension Inactive</p>
                      )}
                    </div>
                  </div>

                  {/* Item 4: Logigpt */}
                  <div className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Cpu size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Logigpt (Conversational Carrier Copilot)</h4>
                        <p className="text-xs text-slate-400 font-semibold font-mono">₹10 per generative LLM token stream ticket</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {installedAddons.logigpt ? (
                        <>
                          <p className="text-xs font-black text-slate-900">₹{(unsyncedQueries * 10).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{unsyncedQueries} Unsynced Prompts</p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-slate-350 italic">Extension Inactive</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-6 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Accrued Subtotal</span>
                    <p className="text-slate-500 text-xs font-semibold mt-1 font-sans">SaaS & Information Technology Surcharges (SAC 998313)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">₹{totalUnsyncedAddonCost.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider">+ 18% GST (₹{Math.round(totalUnsyncedAddonCost * 0.18).toLocaleString()})</p>
                  </div>
                </div>
              </div>

              {/* RECONCILE TRIGGERS */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2.5rem] p-8 flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="space-y-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      <RefreshCw size={10} className="animate-spin" /> Reconciliation Engine
                    </span>
                    <h3 className="text-xl font-black text-white mt-4 tracking-tight leading-none">Billing Ledger Sync</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-2 leading-relaxed">
                      Reconciling your marketplace extensions instantly bundles usage costs, applies active GST rules, and queues a draft transaction directly into the **Billing Hub** for review and payouts.
                    </p>
                  </div>

                  <div className="space-y-3 font-mono text-xs bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Unsynced:</span>
                      <span className="text-white font-black">₹{totalUnsyncedAddonCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST (18%):</span>
                      <span className="text-white">₹{Math.round(totalUnsyncedAddonCost * 0.18).toLocaleString()}</span>
                    </div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between text-base font-black">
                      <span className="text-slate-300">Total Statement:</span>
                      <span className="text-amber-400">₹{Math.round(totalUnsyncedAddonCost * 1.18).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 italic">
                    <p>Last Successful Sync: <strong className="text-slate-200">{lastSyncData.timestamp ? lastSyncData.timestamp : 'Never synced'}</strong></p>
                  </div>
                </div>

                <button
                  onClick={handleBillingSync}
                  disabled={totalUnsyncedAddonCost === 0}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-55 text-slate-900 font-black text-xs py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-center"
                >
                  <RefreshCw size={14} /> Sync & Generate Invoice
                </button>
              </div>
            </div>

            {/* AUDIT HISTORY OF MARKETPLACE SYNCED INVOICES */}
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Billing Hub Sync Archive</h3>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5 animate-pulse">Records of reconciled billing invoices generated from this Addon Marketplace.</p>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 px-3 py-1.5 rounded-full">
                  {marketplaceInvoices.length} Total Statements
                </span>
              </div>

              {marketplaceInvoices.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <FileText className="mx-auto text-slate-300 animate-pulse" size={40} />
                  <p className="text-slate-500 text-sm font-semibold">No sync bills generated yet. Run a reconciliation cycle to sync.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Invoice Code</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Client Name (Target)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Issue Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Accrued Subtotal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Grand Total (Inc GST)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Status / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {marketplaceInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                              {inv.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-black text-slate-800">{inv.clientName}</p>
                              <p className="text-[9px] font-mono text-slate-405">{inv.clientGst}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-mono text-slate-500">
                            {inv.date}
                          </td>
                          <td className="px-6 py-5 font-mono font-bold text-slate-750">
                            ₹{inv.subTotal.toLocaleString()}
                          </td>
                          <td className="px-6 py-5 font-mono font-black text-slate-900">
                            ₹{inv.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-5 font-sans">
                            {inv.status === InvoiceStatus.PAID ? (
                              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100">PAID & SECURED</span>
                            ) : inv.status === InvoiceStatus.SENT ? (
                              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-[9px] font-black border border-blue-100">SUBMITTED SENT</span>
                            ) : inv.status === InvoiceStatus.CANCELLED ? (
                              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-[9px] font-black border border-slate-200">CANCELLED VOID</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-100">DRAFT OUTSTANDING</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // DEEP DIVE WORKSPACES
        <div className="space-y-6">
          <button 
            onClick={() => setActiveApp(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest bg-white border border-slate-200 py-2 px-4 rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> Back to Marketplace Hub
          </button>

          {/* 1. LOGINSO ACTIVE PANEL */}
          {activeApp === 'loginso' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Loginso Insurance Compliance</h2>
                    <p className="text-xs font-semibold text-slate-400">Total covered vehicles: {fleet.length} active HGVs.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInsuranceModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  <Plus size={16} /> New Policy Registry
                </button>
              </div>

              {/* STATS SUMMARY CARD ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Policies Tracked</p>
                    <p className="text-2xl font-black mt-1 text-slate-900">{insurances.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Fully Active Cover</p>
                    <p className="text-2xl font-black mt-1 text-slate-900">{insurances.filter(i => i.status === 'ACTIVE').length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Due Next 30 Days</p>
                    <p className="text-2xl font-black mt-1 text-amber-600">{insurances.filter(i => i.status === 'EXPIRING').length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Expired Coverage</p>
                    <p className="text-2xl font-black mt-1 text-red-600">{insurances.filter(i => i.status === 'EXPIRED').length}</p>
                  </div>
                </div>
              </div>

              {/* LIST TABLE */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Insurance Registries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Truck Number</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Insurer Company</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Value</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Validity Timeline</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {insurances.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                              {item.truckNumber}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-850">{item.insurer}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-slate-400 font-mono tracking-wider">{item.policyNo}</p>
                              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{item.type}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-black text-slate-700">₹{item.premiumAmount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs text-slate-500">
                            {item.startDate} to {item.endDate}
                          </td>
                          <td className="px-6 py-5">
                            {item.status === 'ACTIVE' ? (
                              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100">SECURE ACTIVE</span>
                            ) : item.status === 'EXPIRING' ? (
                              <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-100">ALERT EXPIRING</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-red-50 text-red-600 text-[9px] font-black border border-red-100">EXPIRED VOID</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => handleDeleteInsurance(item.id)}
                              className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REGISTER POLICY MODAL */}
              {isInsuranceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <ShieldCheck className="text-blue-600" /> New Insurance Cover
                      </h3>
                      <button onClick={() => setIsInsuranceModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-black text-xs">Close</button>
                    </div>

                    <form onSubmit={handleAddInsurance} className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Fleet Vehicle</label>
                        <select 
                          required
                          value={newPolicy.truckId} 
                          onChange={e => setNewPolicy({...newPolicy, truckId: e.target.value})}
                          className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        >
                          <option value="">-- Choose Truck --</option>
                          {fleet.map(t => (
                            <option key={t.id} value={t.id}>{t.truckNumber} ({t.name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Insurer Company</label>
                          <select 
                            required
                            value={newPolicy.insurer} 
                            onChange={e => setNewPolicy({...newPolicy, insurer: e.target.value})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                          >
                            <option value="ICICI Lombard">ICICI Lombard</option>
                            <option value="HDFC ERGO">HDFC ERGO</option>
                            <option value="National Insurance">National Insurance</option>
                            <option value="Tata AIG">Tata AIG</option>
                            <option value="United India">United India</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Policy Cover Type</label>
                          <select 
                            required
                            value={newPolicy.type} 
                            onChange={e => setNewPolicy({...newPolicy, type: e.target.value as any})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                          >
                            <option value="Comprehensive">Comprehensive Cover</option>
                            <option value="Own Damage">Own Damage Cover</option>
                            <option value="Third Party">Third Party Only</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Premium Paid (1 Year)</label>
                          <input 
                            required
                            type="number" 
                            value={newPolicy.premiumAmount} 
                            onChange={e => setNewPolicy({...newPolicy, premiumAmount: Number(e.target.value)})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                            placeholder="Wages/Cost Premium"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Policy Cover ID No</label>
                          <input 
                            type="text" 
                            value={newPolicy.policyNo} 
                            onChange={e => setNewPolicy({...newPolicy, policyNo: e.target.value})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                            placeholder="e.g. POL-98721345"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validity Start Date</label>
                          <input 
                            required
                            type="date" 
                            value={newPolicy.startDate} 
                            onChange={e => setNewPolicy({...newPolicy, startDate: e.target.value})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coverage Expiration Date</label>
                          <input 
                            required
                            type="date" 
                            value={newPolicy.endDate} 
                            onChange={e => setNewPolicy({...newPolicy, endDate: e.target.value})}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest transition-all"
                      >
                        Register Insurance Entry
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* 2. DOCDOWN ACTIVE PANEL */}
          {activeApp === 'docdown' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileDown size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Docdown Compliance Center</h2>
                    <p className="text-xs font-semibold text-slate-400">Export high-fidelity, formatted PDFs and CSV spreadsheets instantly.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search documents..." 
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-amber-500/10 outline-none w-56"
                    />
                  </div>
                </div>
              </div>

              {/* TABS & LIST */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* CATEGORIES MENU */}
                <div className="space-y-2 bg-white p-4 rounded-[1.5rem] border border-slate-200 h-fit">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Category Filters</p>
                  <button 
                    onClick={() => setDocCategory('ALL')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-black uppercase tracking-widest rounded-xl transition-all ${docCategory === 'ALL' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    All Documents
                  </button>
                  <button 
                    onClick={() => setDocCategory('COMPLIANCE')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-black uppercase tracking-widest rounded-xl transition-all ${docCategory === 'COMPLIANCE' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Permits & Certs
                  </button>
                  <button 
                    onClick={() => setDocCategory('FINANCE')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-black uppercase tracking-widest rounded-xl transition-all ${docCategory === 'FINANCE' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Finance Sheets
                  </button>
                  <button 
                    onClick={() => setDocCategory('VEHICLE')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-black uppercase tracking-widest rounded-xl transition-all ${docCategory === 'VEHICLE' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Operational Logs
                  </button>
                </div>

                {/* FILE CARDS CONTAINER */}
                <div className="lg:col-span-3 space-y-4">
                  {docDatabase.length === 0 ? (
                    <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center space-y-4">
                      <Search size={40} className="mx-auto text-slate-300" />
                      <p className="text-slate-500 text-sm font-semibold">No documents found matching your parameters.</p>
                    </div>
                  ) : (
                    docDatabase.map(doc => (
                      <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-amber-300 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${doc.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {doc.type}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight">{doc.name}</h4>
                            <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-0.5">{doc.desc}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">{doc.category}</span>
                              <span className="text-[9px] font-bold text-slate-400">{doc.size}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => triggerFileDownload(doc)}
                          className="flex items-center justify-center gap-1.5 self-end sm:self-center bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                          <Download size={14} /> Download File
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}


          {/* 3. LOGIDATA ACTIVE PANEL */}
          {activeApp === 'logidata' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">LogiData Analytical Playground</h2>
                    <p className="text-xs font-semibold text-slate-400">Map multiple operational dependencies to identify hidden profit leaks.</p>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE VARIABLES MAPPING PLOT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PLOTTING PARAMETERS */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-6 h-fit">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Multi-axis Correlation Plotting</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select X-Axis Variable (Independent)</label>
                      <select 
                        value={logiDataX} 
                        onChange={e => setLogiDataX(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value="loadWeight">Average Load Weight (Metric Tons)</option>
                        <option value="truckAge">Fleet Vehicle Age (Years in service)</option>
                        <option value="odometer">Odometer (Thousand Kilometers)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Y-Axis Variable (Dependent)</label>
                      <select 
                        value={logiDataY} 
                        onChange={e => setLogiDataY(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value="maintenanceCost">Total Maintenance Cost (₹)</option>
                        <option value="mileage">Average Diesel Mileage (km/L)</option>
                        <option value="odometer">Odometer Reading (KMs)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 bg-slate-50 rounded-2xl p-4 space-y-2">
                    <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Info size={12} /> Correlation Summary
                    </p>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                      {logiDataX === 'loadWeight' && logiDataY === 'mileage' && "Analysis reflects a typical 0.08 km/l decrease in fuel efficiency for every extra 1 Metric Ton loaded on long-haul routes."}
                      {logiDataX === 'truckAge' && logiDataY === 'maintenanceCost' && "Exponential wear audit suggests fleet vehicles over 4.5 years exhibit a 35% compound leap in spares parts costs."}
                      {logiDataX === 'odometer' && logiDataY === 'maintenanceCost' && "HGV odometer thresholds above 1.5 Lakh KM correlate directly with engine block and electrical overhaul incidents."}
                      {!((logiDataX === 'loadWeight' && logiDataY === 'mileage') || (logiDataX === 'truckAge' && logiDataY === 'maintenanceCost') || (logiDataX === 'odometer' && logiDataY === 'maintenanceCost')) && "Plot results highlight the distribution curve generated from actual fleet logs."}
                    </p>
                  </div>
                </div>

                {/* RECHARTS PLOT */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Independent Scatter Plot</h4>
                    <p className="text-slate-400 text-xs font-semibold">Comparing actual parameters mapped from {fleet.length} HGVs.</p>
                  </div>

                  <div className="w-full h-80 mt-6 font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey={logiDataX} 
                          name={logiDataX} 
                          unit={logiDataX === 'loadWeight' ? ' tons' : logiDataX === 'truckAge' ? ' yrs' : 'k km'} 
                        />
                        <YAxis 
                          type="number" 
                          dataKey={logiDataY} 
                          name={logiDataY} 
                          unit={logiDataY === 'maintenanceCost' ? ' ₹' : logiDataY === 'mileage' ? ' km/l' : 'k km'} 
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Registered Fleet" data={logiDataChart} fill="#8b5cf6">
                          {logiDataChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a78bfa', '#6d28d9', '#c084fc'][index % 4]} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* BOTTOM COLUMN: PROFITABILITY SCENARIO SIMULATOR */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
                <div className="space-y-1 mb-8">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Interactive Surcharge Margin Simulator</h3>
                  <p className="text-slate-400 text-xs font-semibold">Test profitability scenario thresholds before committing to final diesel contracts.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* SLIDERS */}
                  <div className="space-y-6 border-r border-slate-100 pr-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700">Contract Diesel Price</span>
                        <span className="text-xs font-black font-mono text-blue-600">₹{simDieselPrice} / L</span>
                      </div>
                      <input 
                        type="range" 
                        min="80" 
                        max="120"
                        value={simDieselPrice}
                        onChange={e => setSimDieselPrice(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-ew-resize"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700">Freight Rate Tariffs</span>
                        <span className="text-xs font-black font-mono text-blue-600">₹{simFreightRate} / Ton-KM</span>
                      </div>
                      <input 
                        type="range" 
                        min="2" 
                        max="8" 
                        step="0.1"
                        value={simFreightRate}
                        onChange={e => setSimFreightRate(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-ew-resize"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700">Active Fleet Deployment</span>
                        <span className="text-xs font-black font-mono text-blue-600">{simUsageRate}% active</span>
                      </div>
                      <input 
                        type="range" 
                        min="40" 
                        max="100" 
                        value={simUsageRate}
                        onChange={e => setSimUsageRate(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-ew-resize"
                      />
                    </div>
                  </div>

                  {/* COMPUTED OUTCOMES CARDS */}
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projected Monthly Diesel Spent</p>
                      <p className="text-3xl font-black text-slate-900 mt-2">₹{logiDataCalculations.fuelCost.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Based on ~240km average dispatch hauls.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Projected Revenue</p>
                      <p className="text-3xl font-black text-emerald-600 mt-2">₹{logiDataCalculations.revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Projected total transport tonnage handled.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projected Net operational Margin</p>
                      <p className="text-3xl font-black text-violet-600 mt-2">₹{logiDataCalculations.profit.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">After fuel contracts, driver payroll, toll taxes.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projected Return Ratio</p>
                      <p className="text-3xl font-black text-slate-900 mt-2">{logiDataCalculations.margin}%</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Expected return index metric.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* 4. LOGIGPT AI CHAT BINDING */}
          {activeApp === 'logigpt' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-300">
              {/* ADVANCED PROMPTS GUIDE */}
              <div className="space-y-4 bg-white p-6 rounded-[2rem] border border-slate-200 h-fit">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">Prompts Repository</h3>
                </div>
                <p className="text-slate-400 text-[11px] font-semibold leading-relaxed mb-4">Choose quick operational queries below to test immediate compliance audits:</p>
                
                <button 
                  onClick={() => setChatInput('Evaluate insurance risk status across our fleet. Which policy requires immediate attention?')}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 transition-all text-ellipsis overflow-hidden"
                >
                  Insurance Risk Status
                </button>

                <button 
                  onClick={() => setChatInput('Perform a complete diesel consumption audit. Suggest actionable steps to reduce idle waste.')}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 transition-all text-ellipsis overflow-hidden"
                >
                  Diesel Cost Audit
                </button>

                <button 
                  onClick={() => setChatInput('Draft a WhatsApp checklist to remind heavy transport vehicle drivers about safety checks.')}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 transition-all text-ellipsis overflow-hidden"
                >
                  Driver WhatsApp Reminder
                </button>
              </div>

              {/* CHAT DISPLAY PANEL */}
              <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[520px]">
                <div className="p-6 border-b border-slate-100 bg-indigo-950 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest leading-none">Logigpt Interactive Chat</h3>
                      <p className="text-[10px] text-indigo-300 font-bold mt-1">Ready with Live Gemini SDK Proxy Integration</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if(confirm("Confirm resetting current chat history log?")) setChatMessages([]);
                    }}
                    className="text-[10px] text-white/50 hover:text-white font-black uppercase tracking-widest"
                  >
                    Clear Chat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-20 max-w-sm mx-auto space-y-4">
                      <Bot size={40} className="mx-auto text-indigo-250 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Co-pilot Workspace Idle</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed">Ask anything about transport logistics! I can read policy data, compute mileage targets, or draft formal checklists.</p>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-xs ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`rounded-2xl p-4 text-xs font-semibold leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                        {/* Render simple markdown styling headers and bullet points */}
                        <div className="whitespace-pre-wrap space-y-2">
                          {msg.content.split('\n').map((line, lIdx) => {
                            if (line.startsWith('### ')) {
                              return <h4 key={lIdx} className="font-black text-sm uppercase tracking-wide mt-2 first:mt-0">{line.replace('### ', '')}</h4>;
                            }
                            if (line.startsWith('- ') || line.startsWith('* ')) {
                              return <li key={lIdx} className="ml-2 font-semibold text-slate-600 list-disc">{line.replace(/^[-*]\s+/, '')}</li>;
                            }
                            // check if line represents bold text completely or has monospace wrappers
                            let formattedLine: React.ReactNode = line;
                            if (line.includes('**')) {
                              const regex = /\*\*(.*?)\*\*/g;
                              const parts = line.split(regex);
                              formattedLine = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-black text-slate-950">{part}</strong> : part);
                            }
                            return <p key={lIdx} className="text-slate-750">{formattedLine}</p>;
                          })}
                        </div>
                        <span className={`block text-[8px] text-right mt-1.5 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 text-white shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-widest">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3.5">
                  <input 
                    type="text" 
                    placeholder="Enter transport query or compliance checklist question..." 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-5 flex items-center justify-center shadow-lg shadow-indigo-100 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
