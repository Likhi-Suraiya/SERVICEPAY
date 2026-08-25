// src/utils/receiptPdf.js — Money Receipt PDF (jsPDF + autotable)
// Compact layout: A5 width, page height trimmed to the content
// (two-pass render), no footer band, no blank space.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_RGB = [5, 95, 174];
const LIGHT = [231, 231, 255];
const GREY = [108, 117, 125];
const PAGE_W = 419.53; // A5 width


const LOGO_URL = "/assets/img/logoP.png";

// Auto-crop transparent padding from the logo so it fills the panel
const trimTransparent = (dataUrl) =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, c.width, c.height);
          let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
          for (let yy = 0; yy < c.height; yy++) {
            for (let xx = 0; xx < c.width; xx++) {
              if (data[(yy * c.width + xx) * 4 + 3] > 10) {
                if (xx < minX) minX = xx;
                if (xx > maxX) maxX = xx;
                if (yy < minY) minY = yy;
                if (yy > maxY) maxY = yy;
              }
            }
          }
          if (maxX < 0) return resolve(dataUrl);
          const pad = 2;
          minX = Math.max(0, minX - pad);
          minY = Math.max(0, minY - pad);
          maxX = Math.min(c.width - 1, maxX + pad);
          maxY = Math.min(c.height - 1, maxY + pad);
          const out = document.createElement("canvas");
          out.width = maxX - minX + 1;
          out.height = maxY - minY + 1;
          out.getContext("2d").drawImage(
            c, minX, minY, out.width, out.height, 0, 0, out.width, out.height
          );
          resolve(out.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });

let logoCache;
const loadLogo = async () => {
  if (logoCache !== undefined) return logoCache;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) throw new Error("logo fetch failed");
    const blob = await res.blob();
    logoCache = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    logoCache = await trimTransparent(logoCache);
  } catch {
    logoCache = "";
  }
  return logoCache;
};

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
  "Eighty", "Ninety"];
const twoDigits = (n) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
const amountInWords = (value) => {
  let n = Math.floor(Math.abs(value));
  const paisa = Math.round((Math.abs(value) - n) * 100);
  if (n === 0 && paisa === 0) return "Zero Taka Only";
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000);   n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = Math.floor(n / 100);   n %= 100;
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (n) parts.push(twoDigits(n));
  let words = `${parts.join(" ")} Taka`;
  if (paisa) words += ` and ${twoDigits(paisa)} Paisa`;
  return `${words} Only`;
};

const money = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STATUS_COLORS = {
  PAID: [30, 140, 60],
  PARTIAL: [225, 135, 0],
  UNPAID: [200, 50, 50],
};

export const generatePaymentReceipt = async ({
  customer,
  invoice,
  items,
  payment,
  receivedByName,
}) => {
  const logo = await loadLogo();
  const W = PAGE_W;
  const M = 24;

  const draw = (doc) => {
    // ============ HEADER BAND (compact, no pill) ============
    const bandH = 54;
    doc.setFillColor(...BRAND_RGB);
    doc.rect(0, 0, W, bandH, "F");

    if (logo) {
      const panelW = 140, panelH = 42, panelY = 6;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, panelY, panelW, panelH, 6, 6, "F");
      try {
        const props = doc.getImageProperties(logo);
        const maxW = panelW - 12, maxH = panelH - 10;
        let w = maxW, h = (props.height / props.width) * maxW;
        if (h > maxH) { h = maxH; w = (props.width / props.height) * maxH; }
        doc.addImage(logo, M + (panelW - w) / 2, panelY + (panelH - h) / 2, w, h);
      } catch { /* panel stays empty */ }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Property Lift", M, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("MONEY RECEIPT", W - M, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Lift & Generator Service — O & M Department", W - M, 34, { align: "right" });
    doc.text("+0800-7777777  |  mktg980@prangroup.com", W - M, 44, { align: "right" });

    // ============ RECEIVED FROM / SERVICE DETAILS ============
    let y = bandH + 8;
    const colW = (W - 2 * M - 8) / 2;
    const boxH = 88;

    doc.setDrawColor(...BRAND_RGB);
    doc.setLineWidth(0.7);
    doc.roundedRect(M, y, colW, boxH, 3, 3, "S");
    doc.setTextColor(...BRAND_RGB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("RECEIVED FROM", M + 8, y + 12);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9.5);
    doc.text(
      doc.splitTextToSize(customer.companyName || customer.customerName || "-", colW - 16)[0],
      M + 8, y + 24
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const addr = doc.splitTextToSize(customer.fullAddress || "-", colW - 16);
    doc.text(addr.slice(0, 2), M + 8, y + 34);
    doc.text(`Customer ID: ${customer.customerId || "-"}`, M + 8, y + 56);
    doc.text(
      doc.splitTextToSize(`Zone: ${customer.area || "-"}`, colW - 16)[0],
      M + 8, y + 66
    );
    doc.text(
      doc.splitTextToSize(`Contact: ${customer.contactNumber || "-"}`, colW - 16)[0],
      M + 8, y + 76
    );

    // service details box — invoice no & dates live HERE
    const x2 = M + colW + 8;
    doc.roundedRect(x2, y, colW, boxH, 3, 3, "S");
    doc.setTextColor(...BRAND_RGB);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE DETAILS", x2 + 8, y + 12);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.text(`Invoice No: ${invoice.invoiceNo}`, x2 + 8, y + 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Invoice Date: ${invoice.invoiceDate || "-"}`, x2 + 8, y + 36);
    doc.text(`Payment Date: ${payment.payDate || "-"}`, x2 + 8, y + 47);
    doc.text(
      `Asset: ${invoice.assetType || "-"}${invoice.model ? " — " + invoice.model : ""}`,
      x2 + 8, y + 58
    );
    if (invoice.serviceMonth) {
      doc.setFont("helvetica", "bold");
      doc.text(`Service Month: ${invoice.serviceMonth}`, x2 + 8, y + 70);
      doc.setFont("helvetica", "normal");
    }

    // ============ ITEMS ============
    y += boxH + 8;
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["#", "Item", "Qty", "Unit Price (Tk)", "Total (Tk)"]],
      body: (items || []).map((it, i) => [
        i + 1,
        it.itemName,
        it.quantity,
        money(it.unitPrice),
        money(it.totalAmount),
      ]),
      theme: "striped",
      headStyles: { fillColor: BRAND_RGB, fontSize: 7.5, halign: "left" },
      styles: { fontSize: 7.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: {
        0: { cellWidth: 16 },
        2: { halign: "right", cellWidth: 38 },
        3: { halign: "right", cellWidth: 66 },
        4: { halign: "right", cellWidth: 66 },
      },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ============ TOTALS (status word AFTER the amounts) ============
    const totalsW = 200;
    const tx = W - M - totalsW;
    const rowH = 13;
    const status = (invoice.paymentStatus || "Paid").toUpperCase();
    const paidBefore =
      (parseFloat(invoice.paidAmount) || 0) - (parseFloat(payment.amount) || 0);
    const rows = [
      ["Grand Total", money(invoice.totalAmount)],
      ["Previously Paid", money(paidBefore)],
      ["This Payment", money(payment.amount)],
      ["Due Remaining", money(invoice.dueAmount)],
    ];
    doc.setFontSize(8.5);
    rows.forEach(([label, val], i) => {
      const ry = y + i * rowH;
      const strong = label === "This Payment";
      if (strong) {
        doc.setFillColor(...BRAND_RGB);
        doc.rect(tx, ry - 9.5, totalsW, rowH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", label === "Due Remaining" ? "bold" : "normal");
      }
      doc.text(label, tx + 6, ry);
      doc.text(`Tk ${val}`, tx + totalsW - 6, ry, { align: "right" });
    });
    y += rows.length * rowH;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...(STATUS_COLORS[status] || STATUS_COLORS.UNPAID));
    doc.text(status, W - M, y + 1, { align: "right" });
    doc.setTextColor(40, 40, 40);
    y += 10;

    // amount in words (this payment)
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(7.5);
    const words = doc.splitTextToSize(
      `In words: ${amountInWords(parseFloat(payment.amount) || 0)}`,
      W - 2 * M
    );
    doc.text(words, M, y);
    y += words.length * 9 + 4;

    // ============ PAYMENT INFO ============
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(M, y - 4, W - M, y - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `Method: ${payment.method || "-"}${
        payment.receiveAccount ? " (" + payment.receiveAccount + ")" : ""
      }`,
      M, y + 4
    );
    doc.text(`Ref / Trx No: ${payment.refNo || "-"}`, M + 150, y + 4);
    doc.text(`Received By: ${receivedByName || "-"}`, W - M, y + 4, { align: "right" });
    y += 12;
    if (payment.remark) {
      doc.setTextColor(...GREY);
      const rem = doc.splitTextToSize(`Remark: ${payment.remark}`, W - 2 * M);
      doc.text(rem, M, y + 2);
      doc.setTextColor(40, 40, 40);
      y += rem.length * 9;
    }

    // ============ SIGNATURES (flow, no footer band) ============
    const sy = y + 30; // signing space
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.4);
    doc.line(M, sy, M + 110, sy);
    doc.line(W - M - 110, sy, W - M, sy);
    doc.setFontSize(7.5);
    doc.text("Customer Signature", M + 55, sy + 10, { align: "center" });
    doc.text("Authorized Signature", W - M - 55, sy + 10, { align: "center" });

    return sy + 20;
  };

  const probe = new jsPDF({ unit: "pt", format: [W, 2000] });
  const pageH = Math.max(draw(probe), 200);
  // jsPDF swaps [w,h] when they contradict the orientation — declare it
  const doc = new jsPDF({
    unit: "pt",
    format: [W, pageH],
    orientation: pageH >= W ? "portrait" : "landscape",
  });
  draw(doc);
  doc.save(`MoneyReceipt_${payment.payDate || ""}.pdf`);
};

/**
 * Bulk money receipt — ONE collection allocated across multiple invoices.
 * Same brand system as the single receipt: A5 width, page trimmed to
 * content, header band + logo panel, clean allocation table.
 * @param {object} p.customer     { customerId, companyName, customerName, fullAddress, area, contactNumber }
 * @param {object} p.payment      { batchNo, amount, payDate, method, receiveAccount, refNo, remark }
 * @param {Array}  p.allocations  [{ invoiceNo, service, dueBefore, payNow, remaining }]
 * @param {string} p.receivedByName
 */
export const generateBulkPaymentReceipt = async ({
  customer,
  payment,
  allocations,
  receivedByName,
}) => {
  const logo = await loadLogo();
  const W = PAGE_W;
  const M = 24;

  const totalDue = (allocations || []).reduce((t, a) => t + (parseFloat(a.dueBefore) || 0), 0);
  const totalRemaining = (allocations || []).reduce((t, a) => t + (parseFloat(a.remaining) || 0), 0);

  const draw = (doc) => {
    // ============ HEADER BAND ============
    const bandH = 54;
    doc.setFillColor(...BRAND_RGB);
    doc.rect(0, 0, W, bandH, "F");

    if (logo) {
      const panelW = 140, panelH = 42, panelY = 6;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, panelY, panelW, panelH, 6, 6, "F");
      try {
        const props = doc.getImageProperties(logo);
        const maxW = panelW - 12, maxH = panelH - 10;
        let w = maxW, h = (props.height / props.width) * maxW;
        if (h > maxH) { h = maxH; w = (props.width / props.height) * maxH; }
        doc.addImage(logo, M + (panelW - w) / 2, panelY + (panelH - h) / 2, w, h);
      } catch { /* panel stays empty */ }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Property Lift", M, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("MONEY RECEIPT", W - M, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Lift & Generator Service — O & M Department", W - M, 34, { align: "right" });
    doc.text("+0800-7777777  |  mktg980@prangroup.com", W - M, 44, { align: "right" });

    // ============ RECEIVED FROM / PAYMENT DETAILS ============
    let y = bandH + 8;
    const colW = (W - 2 * M - 8) / 2;
    const boxH = 88;

    doc.setDrawColor(...BRAND_RGB);
    doc.setLineWidth(0.7);
    doc.roundedRect(M, y, colW, boxH, 3, 3, "S");
    doc.setTextColor(...BRAND_RGB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("RECEIVED FROM", M + 8, y + 12);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9.5);
    doc.text(
      doc.splitTextToSize(customer.companyName || customer.customerName || "-", colW - 16)[0],
      M + 8, y + 24
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const addr = doc.splitTextToSize(customer.fullAddress || "-", colW - 16);
    doc.text(addr.slice(0, 2), M + 8, y + 34);
    doc.text(`Customer ID: ${customer.customerId || "-"}`, M + 8, y + 56);
    doc.text(
      doc.splitTextToSize(`Zone: ${customer.area || "-"}`, colW - 16)[0],
      M + 8, y + 66
    );
    doc.text(
      doc.splitTextToSize(`Contact: ${customer.contactNumber || "-"}`, colW - 16)[0],
      M + 8, y + 76
    );

    const x2 = M + colW + 8;
    doc.roundedRect(x2, y, colW, boxH, 3, 3, "S");
    doc.setTextColor(...BRAND_RGB);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT DETAILS", x2 + 8, y + 12);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.text(`Receipt / Batch No: ${payment.batchNo || "-"}`, x2 + 8, y + 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Payment Date: ${payment.payDate || "-"}`, x2 + 8, y + 36);
    doc.text(
      `Method: ${payment.method || "-"}${
        payment.receiveAccount ? " (" + payment.receiveAccount + ")" : ""
      }`,
      x2 + 8, y + 47
    );
    doc.text(`Ref / Trx No: ${payment.refNo || "-"}`, x2 + 8, y + 58);
    doc.text(`Invoices Covered: ${(allocations || []).length}`, x2 + 8, y + 69);

    // ============ ALLOCATION TABLE ============
    y += boxH + 8;
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Invoice No", "Service", "Due (Tk)", "Paid Now (Tk)", "Balance (Tk)"]],
      body: (allocations || []).map((a) => [
        a.invoiceNo,
        a.service || "-",
        money(a.dueBefore),
        money(a.payNow),
        money(a.remaining),
      ]),
      theme: "striped",
      headStyles: { fillColor: BRAND_RGB, fontSize: 7.5, halign: "left" },
      styles: { fontSize: 7.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: {
        2: { halign: "right", cellWidth: 66 },
        3: { halign: "right", cellWidth: 70 },
        4: { halign: "right", cellWidth: 66 },
      },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ============ TOTALS ============
    const totalsW = 200;
    const tx = W - M - totalsW;
    const rowH = 13;
    const rows = [
      ["Total Due (selected)", money(totalDue), false],
      ["Amount Received", money(payment.amount), true],
      ["Balance Remaining", money(totalRemaining), false],
    ];
    doc.setFontSize(8.5);
    rows.forEach(([label, val, strong], i) => {
      const ry = y + i * rowH;
      if (strong) {
        doc.setFillColor(...BRAND_RGB);
        doc.rect(tx, ry - 9.5, totalsW, rowH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", label === "Balance Remaining" ? "bold" : "normal");
      }
      doc.text(label, tx + 6, ry);
      doc.text(`Tk ${val}`, tx + totalsW - 6, ry, { align: "right" });
    });
    y += rows.length * rowH;
    doc.setTextColor(40, 40, 40);
    y += 6;

    // amount in words (amount received)
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(7.5);
    const words = doc.splitTextToSize(
      `In words: ${amountInWords(parseFloat(payment.amount) || 0)}`,
      W - 2 * M
    );
    doc.text(words, M, y);
    y += words.length * 9 + 4;

    // ============ RECEIVED BY / REMARK ============
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(M, y - 4, W - M, y - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Received By: ${receivedByName || "-"}`, M, y + 4);
    if (payment.remark) {
      doc.setTextColor(...GREY);
      doc.text(
        doc.splitTextToSize(`Remark: ${payment.remark}`, W - 2 * M - 140),
        M + 140, y + 4
      );
      doc.setTextColor(40, 40, 40);
    }
    y += 12;

    // ============ SIGNATURES ============
    const sy = y + 30;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.4);
    doc.line(M, sy, M + 110, sy);
    doc.line(W - M - 110, sy, W - M, sy);
    doc.setFontSize(7.5);
    doc.text("Customer Signature", M + 55, sy + 10, { align: "center" });
    doc.text("Authorized Signature", W - M - 55, sy + 10, { align: "center" });

    return sy + 20;
  };

  const probe = new jsPDF({ unit: "pt", format: [W, 2000] });
  const pageH = Math.max(draw(probe), 200);
  const doc = new jsPDF({
    unit: "pt",
    format: [W, pageH],
    orientation: pageH >= W ? "portrait" : "landscape",
  });
  draw(doc);
  doc.save(`MoneyReceipt_${payment.payDate || ""}.pdf`);
};