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
    format: [80, 160 + job.problemDescription.length / 2], // Dynamic height based on content
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(settings.shopName || "RepairXpert", 40, 10, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let currentY = 17;
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
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${settings.gstin}`, 40, currentY, { align: "center" });
    doc.setFont("helvetica", "normal");
    currentY += 4;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("REPAIR INVOICE", 40, currentY, { align: "center" });
  currentY += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Tracking: ${job.jobId}`, 5, currentY);
  doc.text(
    `Date: ${new Date(job.createdAt).toLocaleDateString()}`,
    75,
    currentY,
    { align: "right" },
  );
  currentY += 5;


  doc.setLineWidth(0.2);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Customer Details:", 5, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${job.customerName}`, 5, currentY);
  currentY += 4;
  doc.text(`Mobile: ${job.customerMobile}`, 5, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Device Details:", 5, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Model: ${job.deviceBrand} ${job.deviceModel || ""}`, 5, currentY);
  currentY += 5;

  const tableData: any[][] = [];
  tableData.push([
    job.problemDescription,
    `Rs.${job.estimatedCost}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 5, right: 5 },
    head: [["Service Description", "Amount"]],
    body: tableData,
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fontStyle: "bold", fillColor: [240, 240, 240], textColor: [0,0,0], lineWidth: 0.1, lineColor: [200, 200, 200] },
    bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] } as any
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY + 10;
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 5, currentY);
  doc.text(
    `Rs. ${payment ? payment.amount : job.estimatedCost}`,
    75,
    currentY,
    { align: "right" },
  );
  currentY += 6;

  if (payment) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`Status: PAID via ${payment.method.toUpperCase()}`, 5, currentY);
    currentY += 5;
  } else {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`Status: UNPAID`, 5, currentY);
    currentY += 5;
  }

  doc.setLineWidth(0.5);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for choosing us!", 40, currentY, { align: "center" });
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  const trackUrl = `${typeof window !== "undefined" ? window.location.origin : "https://repairxpert.lovable.app"}/track/${job.jobId}`;
  doc.text(`Track live: ${trackUrl}`, 40, currentY, { align: "center" });
  currentY += 3;
  doc.text(
    `Visit again to ${settings.shopName || "RepairXpert"}`,
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
    format: [80, 140],
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(settings.shopName || "RepairXpert", 40, 10, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let currentY = 17;
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
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${settings.gstin}`, 40, currentY, { align: "center" });
    doc.setFont("helvetica", "normal");
    currentY += 4;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SALES INVOICE", 40, currentY, { align: "center" });
  currentY += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Tracking: ${sell.sellId}`, 5, currentY);
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
        `${sell.sellPrice}`,
        `${sell.total}`,
      ],
    ],
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fontStyle: "bold", fillColor: [240, 240, 240], textColor: [0,0,0], lineWidth: 0.1, lineColor: [200, 200, 200] },
    bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] } as any
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY + 10;
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 5, currentY);
  doc.text(`Rs. ${sell.total}`, 75, currentY, { align: "right" });
  currentY += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(`Payment: PAID via ${sell.paymentMethod.toUpperCase()}`, 5, currentY);
  currentY += 6;

  doc.setLineWidth(0.5);
  doc.line(5, currentY, 75, currentY);
  currentY += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for your purchase!", 40, currentY, { align: "center" });
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(
    `ServiceHub - Powered by Technology`,
    40,
    currentY,
    { align: "center" },
  );

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

  const primaryColor = [79, 70, 229]; // Modern Indigo
  const textColor = [51, 65, 85]; // Slate 700
  const lightBg = [248, 250, 252]; // Slate 50

  // Top Accent Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, "F");

  // Shop Info & Logo Area
  doc.setTextColor(30, 41, 59); // Dark slate
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text((settings as any)?.shop_name || settings?.shopName || "ServiceHub", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  let currentY = 32;
  if (settings?.address) {
    const addrLines = doc.splitTextToSize(settings.address, 80);
    doc.text(addrLines, 20, currentY);
    currentY += addrLines.length * 5;
  }
  if (settings?.phone) {
    doc.text(`Phone: ${settings.phone}`, 20, currentY);
    currentY += 5;
  }
  if (settings?.gstin) {
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${settings.gstin}`, 20, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 5;
  }

  // Right Side - Invoice Details
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(120, 15, 70, 40, 3, 3, "F");
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 185, 27, { align: "right" });

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.text(`Invoice No:`, 125, 36);
  doc.setFont("helvetica", "bold");
  doc.text(`#${invoice.id.substring(0, 8).toUpperCase()}`, 185, 36, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(`Date:`, 125, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`${new Date(invoice.created_at).toLocaleDateString()}`, 185, 42, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.text(`Status:`, 125, 48);
  doc.setFont("helvetica", "bold");
  const isPaid = invoice.status === "paid";
  if (isPaid) {
    doc.setTextColor(22, 163, 74); // Green
  } else {
    doc.setTextColor(220, 38, 38); // Red
  }
  doc.text(`${(invoice.status || "unpaid").toUpperCase()}`, 185, 48, { align: "right" });

  // Bill To Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 20, Math.max(currentY + 10, 65));
  
  const billToY = Math.max(currentY + 16, 71);
  doc.setFontSize(10);
  doc.text(invoice.customer_name || "Valued Customer", 20, billToY);
  doc.setFont("helvetica", "normal");
  doc.text(`Mobile: ${invoice.customer_mobile || "N/A"}`, 20, billToY + 5);

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
    items = [{ description: "General Services", cost: invoice.amount }];
  }

  const tableRows = items.map((item, index) => [
    index + 1,
    item.description,
    1,
    `Rs. ${Number(item.cost).toFixed(2)}`,
    `Rs. ${Number(item.cost).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: billToY + 15,
    head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor as any,
      textColor: [255, 255, 255] as any,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: textColor as any,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: lightBg as any,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // Totals Section
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(120, finalY + 10, 70, 35, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 125, finalY + 20);
  doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 185, finalY + 20, { align: "right" });
  
  doc.text("Tax (0%):", 125, finalY + 27);
  doc.text(`Rs. 0.00`, 185, finalY + 27, { align: "right" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(125, finalY + 32, 185, finalY + 32);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Grand Total:", 125, finalY + 40);
  doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 185, finalY + 40, { align: "right" });

  // Payment Details Info
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Payment Information", 20, finalY + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Method: ${(invoice.payment_method || "cash").toUpperCase()}`, 20, finalY + 22);

  // Footer / Terms
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setLineWidth(0.2);
  doc.line(20, pageHeight - 35, 190, pageHeight - 35);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Terms & Conditions", 20, pageHeight - 28);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("1. All sales are final. Warranty claims require presenting this original invoice.", 20, pageHeight - 23);
  doc.text("2. Please inspect repaired items carefully before leaving the premises.", 20, pageHeight - 19);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Thank you for doing business with ${(settings as any)?.shop_name || settings?.shopName || "us"}!`, 105, pageHeight - 10, { align: "center" });

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

