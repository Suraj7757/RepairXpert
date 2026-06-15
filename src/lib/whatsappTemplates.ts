// WhatsApp message templates for status changes & reminders
// All templates include the public tracking link so customers can self-serve.

const TRACK_BASE =
  typeof window !== "undefined" ? `${window.location.origin}/track/` : "https://repairxpert.lovable.app/track/";

const trackLine = (jobId: string) => `\n🔗 Track live: ${TRACK_BASE}${jobId}`;

export const STATUS_TEMPLATES: Record<
  string,
  (j: {
    customerName: string;
    jobId: string;
    deviceBrand: string;
    deviceModel?: string;
    estimatedCost?: number;
    shopName?: string;
  }) => string
> = {
  Received: (j) =>
    `Namaste ${j.customerName}! 🙏\n\nAapka ${j.deviceBrand} ${j.deviceModel || ""} hamne *receive* kar liya hai.\nJob ID: *${j.jobId}*\n\nDiagnose karke jaldi update denge.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Diagnosed: (j) =>
    `Hi ${j.customerName},\n\nAapke device (${j.deviceBrand}) ka *diagnosis* complete ho gaya hai.\nEstimated cost: *₹${j.estimatedCost || 0}*\nJob ID: *${j.jobId}*\n\nApprove karne ke liye reply karein.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  "In Progress": (j) =>
    `Update! 🔧\n\nAapka ${j.deviceBrand} ab *repair me hai*.\nJob ID: *${j.jobId}*\n\nReady hone par message bhejenge.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  "Re-work": (j) =>
    `Heads up ${j.customerName},\n\nAapke device (${j.deviceBrand}) par *re-work* shuru kiya gaya hai. Same fault dobara dekha gaya hai — jaldi solve karenge.\nJob ID: *${j.jobId}*${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Ready: (j) =>
    `Good news! ✅\n\nAapka ${j.deviceBrand} *ready* hai pickup ke liye.\nJob ID: *${j.jobId}*\nFinal amount: *₹${j.estimatedCost || 0}*\n\nShop aakar collect karein.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Delivered: (j) =>
    `Thank you ${j.customerName}! 🙏\n\nAapka ${j.deviceBrand} *deliver* ho gaya hai.\nJob ID: *${j.jobId}*\n\n6 mahine ki repair warranty hai. Koi issue ho to contact karein.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Rejected: (j) =>
    `Hi ${j.customerName},\n\nAapke device (${j.deviceBrand}) ka repair *reject* kiya gaya hai. Device shop me pickup ke liye ready hai.\nJob ID: *${j.jobId}*${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Unrepairable: (j) =>
    `Hi ${j.customerName},\n\nUnfortunately aapka ${j.deviceBrand} *unrepairable* hai. Detail ke liye contact karein. Device pickup ke liye taiyar hai.\nJob ID: *${j.jobId}*${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Returned: (j) =>
    `Hi ${j.customerName},\n\nAapka ${j.deviceBrand} *return* ho gaya hai.\nJob ID: *${j.jobId}*\n\nThanks for visiting!${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`,
  Cancelled: (j) =>
    `Hi ${j.customerName},\n\nAapke job *${j.jobId}* ko *cancel* kar diya gaya hai. Koi sawaal ho to contact karein.\n\n— ${j.shopName || "RepairXpert"}`,
};

export const SELL_TEMPLATES = {
  invoice: (s: {
    customerName: string;
    sellId: string;
    itemName: string;
    quantity: number;
    total: number;
    shopName?: string;
  }) =>
    `Hi ${s.customerName}! 🛒\n\nThank you for purchase from *${s.shopName || "RepairXpert"}*.\nInvoice: *${s.sellId}*\nItem: ${s.itemName} × ${s.quantity}\nTotal: *₹${s.total}*${trackLine(s.sellId)}`,
  outForDelivery: (s: {
    customerName: string;
    sellId: string;
    shopName?: string;
  }) =>
    `Hi ${s.customerName},\n\nAapka order *${s.sellId}* *out for delivery* hai. Aaj receive ho jayega.${trackLine(s.sellId)}\n\n— ${s.shopName || "RepairXpert"}`,
};

export const PAYMENT_REMINDER = (j: {
  customerName: string;
  jobId: string;
  amount: number;
  shopName?: string;
}) =>
  `Hi ${j.customerName},\n\nAapke job *${j.jobId}* ka payment *₹${j.amount}* pending hai. Kripya jaldi clear karein.${trackLine(j.jobId)}\n\nThanks,\n${j.shopName || "RepairXpert"}`;

export const PENDING_FOLLOWUP = (j: {
  customerName: string;
  jobId: string;
  status: string;
  shopName?: string;
}) =>
  `Hi ${j.customerName},\n\nAapka job *${j.jobId}* abhi *${j.status}* status me hai. Update jaldi denge.${trackLine(j.jobId)}\n\n— ${j.shopName || "RepairXpert"}`;

export function openWhatsApp(mobile: string, text: string) {
  const phone = (mobile || "").replace(/\D/g, "");
  const num = phone.length === 10 ? `91${phone}` : phone;
  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
}

export function buildTrackingUrl(trackingId: string) {
  return `${TRACK_BASE}${trackingId}`;
}
