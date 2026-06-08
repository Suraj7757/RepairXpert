// WhatsApp message templates for status changes & reminders
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
    `Namaste ${j.customerName}! 🙏\n\nAapka ${j.deviceBrand} ${j.deviceModel || ""} hamne *receive* kar liya hai.\nJob ID: *${j.jobId}*\n\nDiagnose karke jaldi update denge.\n\n— ${j.shopName || "RepairXpert"}`,
  Diagnosed: (j) =>
    `Hi ${j.customerName},\n\nAapke device (${j.deviceBrand}) ka *diagnosis* complete ho gaya hai.\nEstimated cost: *₹${j.estimatedCost || 0}*\nJob ID: *${j.jobId}*\n\nApprove karne ke liye reply karein.\n\n— ${j.shopName || "RepairXpert"}`,
  "In Progress": (j) =>
    `Update! 🔧\n\nAapka ${j.deviceBrand} ab *repair me hai*.\nJob ID: *${j.jobId}*\n\nReady hone par message bhejenge.\n\n— ${j.shopName || "RepairXpert"}`,
  Ready: (j) =>
    `Good news! ✅\n\nAapka ${j.deviceBrand} *ready* hai pickup ke liye.\nJob ID: *${j.jobId}*\nFinal amount: *₹${j.estimatedCost || 0}*\n\nShop aakar collect karein.\n\n— ${j.shopName || "RepairXpert"}`,
  Delivered: (j) =>
    `Thank you ${j.customerName}! 🙏\n\nAapka ${j.deviceBrand} *deliver* ho gaya hai.\nJob ID: *${j.jobId}*\n\n6 mahine ki repair warranty hai. Koi issue ho to contact karein.\n\n— ${j.shopName || "RepairXpert"}`,
};

export const PAYMENT_REMINDER = (j: {
  customerName: string;
  jobId: string;
  amount: number;
  shopName?: string;
}) =>
  `Hi ${j.customerName},\n\nAapke job *${j.jobId}* ka payment *₹${j.amount}* pending hai. Kripya jaldi clear karein.\n\nThanks,\n${j.shopName || "RepairXpert"}`;

export const PENDING_FOLLOWUP = (j: {
  customerName: string;
  jobId: string;
  status: string;
  shopName?: string;
}) =>
  `Hi ${j.customerName},\n\nAapka job *${j.jobId}* abhi *${j.status}* status me hai. Update jaldi denge.\n\n— ${j.shopName || "RepairXpert"}`;

export function openWhatsApp(mobile: string, text: string) {
  const phone = mobile.replace(/\D/g, "");
  const num = phone.length === 10 ? `91${phone}` : phone;
  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
}
