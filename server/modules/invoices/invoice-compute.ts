type GstType = "IGST" | "CGST_SGST";

export interface OrderLike {
  id: string;
  quantity: number;
  ratePerMT: number;
  actualQuantity?: number;
  hasGST?: boolean;
}

export interface InvoiceComputeInput {
  orders: OrderLike[];
  gstRate: number;
  gstType: GstType;
  tdsAmount?: number;
  discountAmount?: number;
  tcsRate?: number;
  roundOff?: number;
}

export interface InvoiceTotals {
  subTotal: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  tcsAmount: number;
  autoRoundOff: number;
  totalAmount: number;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeInvoiceTotals(input: InvoiceComputeInput): InvoiceTotals {
  const subTotal = r2(
    input.orders.reduce((sum, o) => {
      const qty = typeof o.actualQuantity === "number" ? o.actualQuantity : o.quantity;
      return sum + (Number(qty) || 0) * (Number(o.ratePerMT) || 0);
    }, 0)
  );

  const discount = Number(input.discountAmount) || 0;
  const taxable = Math.max(0, subTotal - discount);

  const gstRate = Number(input.gstRate) || 0;
  const gstAmount = r2((taxable * gstRate) / 100);
  const cgstAmount = input.gstType === "CGST_SGST" ? r2(gstAmount / 2) : 0;
  const sgstAmount = input.gstType === "CGST_SGST" ? r2(gstAmount - cgstAmount) : 0;
  const igstAmount = input.gstType === "IGST" ? gstAmount : 0;

  const tcsRate = Number(input.tcsRate) || 0;
  const tcsAmount = r2((taxable * tcsRate) / 100);

  const tds = Number(input.tdsAmount) || 0;
  const preRound = taxable + gstAmount + tcsAmount - tds;
  const rounded = Math.round(preRound);
  const autoRoundOff = r2(rounded - preRound);
  const totalAmount = rounded + (Number(input.roundOff) || 0);

  return {
    subTotal,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    tcsAmount,
    autoRoundOff,
    totalAmount: r2(totalAmount),
  };
}

export function summarisePaidAmount(payments: Array<{ amount: number }> = []): number {
  return r2(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
}

export function deriveInvoiceStatus(
  totals: { totalAmount: number },
  paidAmount: number,
  dueDate: string,
  currentStatus?: string
): string {
  if (currentStatus === "CANCELLED") return "CANCELLED";
  if (paidAmount >= totals.totalAmount && totals.totalAmount > 0) return "PAID";
  if (paidAmount > 0) return "PARTIAL";
  if (dueDate && Date.parse(dueDate) < Date.now()) return "OVERDUE";
  return currentStatus || "DRAFT";
}
