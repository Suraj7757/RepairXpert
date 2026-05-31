import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RepairJob, Payment, ShopSettings } from "./types";

export interface SellInvoiceData {
  sellId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  sellPrice: number;
  total: number;
  customerName: string;
  customerMobile: string;
  paymentMethod: string;
  createdAt: string;
}

export function generateInvoicePDF(
  job: RepairJob,
  payment: Payment | undefined,
  settings: ShopSettings,
) {
  // 80mm width is common for thermal printers (approx 226 points)
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 150 + job.problemDescription.length / 2], // Dynamic height based on content
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(settings.shopName || "Servixo", 40, 10, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let currentY = 15;
  if (settings.address) {
    const splitAddr = doc.splitTextToSize(settings.address, 70);
    doc.text(splitAddr, 40, currentY, { align: "center" });
    currentY += splitAddr.length * 3;
  }
  if (settings.phone) {
    doc.text(`Phone: ${settings.phone}`, 40, currentY, { align: "center" });
    currentY += 4;
  }
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}`, 40, currentY, { align: "center" });
    currentY += 4;
  }

  doc.setLineWidth(0.1);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("REPAIR BILL", 40, currentY, { align: "center" });
  currentY += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Job ID: ${job.jobId}`, 5, currentY);
  doc.text(
    `Date: ${new Date(job.createdAt).toLocaleDateString()}`,
    75,
    currentY,
    { align: "right" },
  );
  currentY += 5;

  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Customer:", 5, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${job.customerName}`, 20, currentY);
  currentY += 4;
  doc.text(`Mobile: ${job.customerMobile}`, 20, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Device:", 5, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${job.deviceBrand} ${job.deviceModel || ""}`, 20, currentY);
  currentY += 4;

  const tableData: any[][] = [];
  tableData.push([
    "Service",
    job.problemDescription,
    `Rs.${job.estimatedCost}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 5, right: 5 },
    head: [["Item", "Desc", "Amt"]],
    body: tableData,
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY + 10;
  currentY += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Amount: Rs.${payment ? payment.amount : job.estimatedCost}`,
    75,
    currentY,
    { align: "right" },
  );
  currentY += 6;

  if (payment) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Paid via: ${payment.method}`, 5, currentY);
    currentY += 4;
  }

  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(6);
  doc.text("Thank you for choosing us!", 40, currentY, { align: "center" });
  currentY += 3;
  doc.text(
    `Visit again to ${settings.shopName || "Servixo"}`,
    40,
    currentY,
    { align: "center" },
  );

  return doc;
}

export function downloadInvoice(
  job: RepairJob,
  payment: Payment | undefined,
  settings: ShopSettings,
) {
  const doc = generateInvoicePDF(job, payment, settings);
  doc.save(`Bill-${job.jobId}.pdf`);
}

export function generateSellInvoicePDF(
  sell: SellInvoiceData,
  settings: ShopSettings,
) {
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 130],
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(settings.shopName || "Servixo", 40, 10, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let currentY = 15;
  if (settings.address) {
    const splitAddr = doc.splitTextToSize(settings.address, 70);
    doc.text(splitAddr, 40, currentY, { align: "center" });
    currentY += splitAddr.length * 3;
  }
  if (settings.phone) {
    doc.text(`Phone: ${settings.phone}`, 40, currentY, { align: "center" });
    currentY += 4;
  }

  doc.setLineWidth(0.1);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SALES BILL", 40, currentY, { align: "center" });
  currentY += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Sale ID: ${sell.sellId}`, 5, currentY);
  doc.text(
    `Date: ${new Date(sell.createdAt).toLocaleDateString()}`,
    75,
    currentY,
    { align: "right" },
  );
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 5, right: 5 },
    head: [["Item", "Qty", "Price", "Total"]],
    body: [
      [
        sell.itemName,
        String(sell.quantity),
        `Rs.${sell.sellPrice}`,
        `Rs.${sell.total}`,
      ],
    ],
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY + 10;
  currentY += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs.${sell.total}`, 75, currentY, { align: "right" });
  currentY += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment: ${sell.paymentMethod}`, 5, currentY);
  currentY += 6;

  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(6);
  doc.text("Thank you for your purchase!", 40, currentY, { align: "center" });

  return doc;
}

export function downloadSellInvoice(
  sell: SellInvoiceData,
  settings: ShopSettings,
) {
  const doc = generateSellInvoicePDF(sell, settings);
  doc.save(`Sale-${sell.sellId}.pdf`);
}

export interface GenericInvoiceData {
  id: string;
  customer_name: string;
  customer_mobile: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  jobs_details?: Array<{ description: string; cost: number }>;
}

export function generateGenericInvoicePDF(
  invoice: GenericInvoiceData,
  settings: ShopSettings,
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [67, 56, 202]; // Indigo
  const textColor = [31, 41, 55]; // Slate 800

  // Header band
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.shop_name || "Servixo Pro", 20, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let headerText = "";
  if (settings?.address) headerText += settings.address;
  if (settings?.phone) headerText += `  |  Phone: ${settings.phone}`;
  if (settings?.gstin) headerText += `  |  GSTIN: ${settings.gstin}`;
  doc.text(headerText, 20, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 190, 22, { align: "right" });

  // Reset text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Invoice Meta
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice To:", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer_name || "Valued Customer", 20, 60);
  doc.text(`Mobile: ${invoice.customer_mobile || "N/A"}`, 20, 65);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice details:", 130, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${invoice.id.substring(0, 8).toUpperCase()}`, 130, 60);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 130, 65);
  doc.text(`Payment Status: ${(invoice.status || "unpaid").toUpperCase()}`, 130, 70);
  doc.text(`Method: ${(invoice.payment_method || "cash").toUpperCase()}`, 130, 75);

  // Table Items
  let items: Array<{ description: string; cost: number }> = [];
  try {
    if (typeof invoice.jobs_details === "string") {
      items = JSON.parse(invoice.jobs_details);
    } else if (Array.isArray(invoice.jobs_details)) {
      items = invoice.jobs_details;
    }
  } catch (e) {
    items = [];
  }

  if (items.length === 0) {
    items = [{ description: "General Repair Services", cost: invoice.amount }];
  }

  const tableRows = items.map((item, index) => [
    index + 1,
    item.description,
    1,
    `Rs. ${item.cost}`,
    `Rs. ${item.cost}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["S.No", "Description", "Qty", "Unit Price", "Total"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor as any,
      textColor: [255, 255, 255] as any,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // Totals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Grand Total:", 130, finalY + 10);
  doc.text(`Rs. ${invoice.amount}`, 190, finalY + 10, { align: "right" });

  // Footer / Terms
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Terms & Conditions:", 20, 260);
  doc.text("1. All sales are final. Warranty claims require presenting this invoice.", 20, 264);
  doc.text("2. Please inspect repaired items carefully before leaving the shop.", 20, 268);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Thank you for doing business with ${settings?.shop_name || "us"}!`, 105, 280, { align: "center" });

  return doc;
}

export function downloadGenericInvoice(
  invoice: GenericInvoiceData,
  settings: ShopSettings,
) {
  const doc = generateGenericInvoicePDF(invoice, settings);
  doc.save(`Invoice-${invoice.id.substring(0, 8).toUpperCase()}.pdf`);
}

export function shareInvoiceWhatsApp(
  customerMobile: string,
  customerName: string,
  amount: number,
  invoiceId: string,
  items: string,
  shopName: string,
) {
  const cleanMobile = customerMobile.replace(/\D/g, "");
  const formattedMobile = cleanMobile.startsWith("91") && cleanMobile.length === 12 
    ? cleanMobile 
    : cleanMobile.length === 10 
      ? "91" + cleanMobile 
      : cleanMobile;

  const text = `Hello ${customerName},\n\nYour invoice from *${shopName}* has been generated.\n\n*Invoice Details:*\n- Invoice ID: ${invoiceId.substring(0, 8).toUpperCase()}\n- Items: ${items}\n- Total Amount: Rs. ${amount}\n\nThank you for choosing us!\nVisit again.`;
  
  const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

