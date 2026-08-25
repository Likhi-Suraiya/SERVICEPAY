import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

/**
 * Format currency amount with 2 decimal places (Indian format)
 */
const formatAmount = (amount) => {
  if (amount === undefined || amount === null || amount === "") return "0.00";
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const firstAvailableValue = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
};

const getRateIncTax = (item) => {
  const directValue = firstAvailableValue(item, [
    "item_UnitPriceIncTax",
    "Item_UnitPriceIncTax",
    "UNITPRICE_INCTAX",
    "ITEM_UNITPRICEINCTAX",
    "ITEM_UNITPRICE_INCTAX",
    "RATE_INCTAX",
    "RATE_INC_TAX",
    "RATEINCTAX",
    "ITEM_RATEINCTAX",
  ]);

  if (directValue !== "") {
    return directValue;
  }

  const totalItemValue = parseFloat(
    firstAvailableValue(item, ["item_TotItemVal", "ITEM_TOTITEMVAL"]),
  );
  const qty = parseFloat(firstAvailableValue(item, ["item_Qty", "ITEM_QTY"]));
  if (!Number.isNaN(totalItemValue) && !Number.isNaN(qty) && qty > 0) {
    return totalItemValue / qty;
  }

  const unitPrice = parseFloat(
    firstAvailableValue(item, ["item_UnitPrice", "ITEM_UNITPRICE"]),
  );
  const gstRate = parseFloat(
    firstAvailableValue(item, ["item_GstRt", "ITEM_GSTRT"]),
  );
  if (!Number.isNaN(unitPrice) && !Number.isNaN(gstRate)) {
    return unitPrice * (1 + gstRate / 100);
  }

  return 0;
};

/**
 * Convert number to words (Indian format)
 */
const numberToWords = (num) => {
  if (num === undefined || num === null || num === "")
    return "Zero Rupees Only";

  const amount = parseFloat(num);
  if (isNaN(amount)) return "Zero Rupees Only";

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertToWords = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    return (
      tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "") + " "
    );
  };

  const getCroreLakhThousandHundred = (n) => {
    if (n === 0) return "";

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const hundred = Math.floor((n % 1000) / 100);
    const remaining = n % 100;

    let result = "";

    if (crore > 0) {
      result += convertToWords(crore) + "Crore ";
    }
    if (lakh > 0) {
      result += convertToWords(lakh) + "Lakh ";
    }
    if (thousand > 0) {
      result += convertToWords(thousand) + "Thousand ";
    }
    if (hundred > 0) {
      result += convertToWords(hundred) + "Hundred ";
    }
    if (remaining > 0) {
      result += convertToWords(remaining);
    }

    return result.trim();
  };

  const rupeesInWords = getCroreLakhThousandHundred(rupees);
  const result = rupeesInWords ? rupeesInWords + " Rupees" : "Zero Rupees";

  if (paise > 0) {
    return result + " and " + convertToWords(paise).trim() + " Paise Only";
  }
  return result + " Only";
};

/**
 * Format date to DD-MMM-YY (e.g., 19-May-26)
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .replace(/ /g, "-");
};

/**
 * Format date time to DD-MMM-YY HH:MM AM/PM
 */
const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return (
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }) +
    " " +
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

/**
 * Wrap long text
 */
const wrapText = (text, maxLength = 45) => {
  if (!text) return [""];
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).length <= maxLength) {
      currentLine = currentLine ? currentLine + " " + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Wrap long text for multi-line cells
 */
const wrapTextForCell = (text, maxCharsPerLine = 50) => {
  if (!text) return [""];
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < text.length; i++) {
    currentLine += text[i];
    if (currentLine.length >= maxCharsPerLine && text[i] === " ") {
      lines.push(currentLine.trim());
      currentLine = "";
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.length ? lines : [text];
};

/**
 * Generate QR Code as DataURL (square)
 */
const generateQRCodeDataURL = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      width: 90,
      height: 90,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return null;
  }
};

/**
 * Draw the complete bordered box with seller, buyer, delivery, and invoice details
 */
const drawCompleteBorderedBox = (
  doc,
  pageWidth,
  margin,
  boxStartY,
  seller,
  buyer,
  invoice,
) => {
  const boxHeight = 115;
  const boxWidth = pageWidth - 2 * margin;

  // Draw main box border
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, boxStartY, boxWidth, boxHeight);

  // Draw vertical divider line in the middle
  const dividerX = margin + boxWidth / 2;
  doc.line(dividerX, boxStartY, dividerX, boxStartY + boxHeight);

  // ========== LEFT SECTION (Seller, Receiver, Delivery) ==========
  const leftX = margin + 3;
  const rightX = dividerX + 3;
  let leftY = boxStartY + 5;
  let rightY = boxStartY + 5;

  const maxCharsPerLine = 50;

  // ---------- Seller (Bill from) Section ----------
  // doc.setFontSize(9);
  // doc.setFont("helvetica", "normal");
  // doc.text("Seller (Bill from):", leftX, leftY);
  // leftY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  const sellerNameLines = wrapText(seller.lglNm || "", maxCharsPerLine);
  sellerNameLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const sellerAddrFull = `${seller.addr1 || ""} ${seller.addr2 || ""}`.trim();
  const sellerAddrLines = wrapText(sellerAddrFull, maxCharsPerLine);
  sellerAddrLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  const sellerLocLines = wrapText(seller.loc || "", maxCharsPerLine);
  sellerLocLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  doc.text(`GSTIN/UIN: ${seller.gstin || ""}`, leftX, leftY);
  leftY += 4.5;
  doc.text(
    `State Name: ${seller.stateName || ""}, Code: ${seller.stcd || ""}`,
    leftX,
    leftY,
  );
  leftY += 4;

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(leftX - 3, leftY, dividerX, leftY);
  leftY += 4;

  // ---------- Receiver (Bill to) Section ----------
  doc.setFont("helvetica", "normal");
  doc.text("Receiver (Bill to):", leftX, leftY);
  leftY += 4.5;

  doc.setFont("helvetica", "bold");
  const buyerNameLines = wrapText(buyer.lglNm || "", maxCharsPerLine);
  buyerNameLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const buyerAddrLines = wrapText(`${buyer.addr1 || ""}`, maxCharsPerLine);
  buyerAddrLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  const buyerAddr2Lines = wrapText(`${buyer.addr2 || ""}`, maxCharsPerLine);
  buyerAddr2Lines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  doc.text(`GSTIN/UIN: ${buyer.gstin || ""}`, leftX, leftY);
  leftY += 4.5;
  doc.text(
    `State Name: ${buyer.stateName || ""}, Code: ${buyer.stcd || ""}`,
    leftX,
    leftY,
  );
  leftY += 4.5;
  doc.text(`Place of Supply: ${buyer.stateName || ""}`, leftX, leftY);
  leftY += 4;

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(leftX - 3, leftY, dividerX, leftY);
  leftY += 4;

  // ---------- Delivery (Ship to) Section ----------
  doc.setFont("helvetica", "normal");
  doc.text("Delivery (Ship to):", leftX, leftY);
  leftY += 4.5;

  doc.setFont("helvetica", "bold");
  const shipNameLines = wrapText(buyer.lglNm || "", maxCharsPerLine);
  shipNameLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const shipAddrLines = wrapText(`${buyer.addr1 || ""}`, maxCharsPerLine);
  shipAddrLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  const shipAddr2Lines = wrapText(`${buyer.addr2 || ""}`, maxCharsPerLine);
  shipAddr2Lines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 4.5;
  });

  doc.text(`GSTIN/UIN: ${buyer.gstin || ""}`, leftX, leftY);
  leftY += 4.5;
  doc.text(
    `State Name: ${buyer.stateName || ""}, Code: ${buyer.stcd || ""}`,
    leftX,
    leftY,
  );

  // ========== RIGHT SECTION (Invoice Details) ==========
  const rightSectionWidth = boxWidth / 2 - 6;
  const rightSectionDividerX = rightX + rightSectionWidth / 2;
  const col1RightX = rightX;
  const col2RightX = rightSectionDividerX + 4;

  const drawDividerLine = (yPosition) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(rightX, yPosition, pageWidth - margin, yPosition);
  };

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No.", col1RightX, rightY);
  doc.text("e-Way Bill No.", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.docNo || "", col1RightX, rightY);
  doc.text(invoice.ewayBillNo || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Dated", col1RightX, rightY);
  doc.text("Delivery Note", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(
    invoice.docDate ? formatDate(invoice.docDate) : "",
    col1RightX,
    rightY,
  );
  // doc.text(invoice.deliveryNo || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Mode/Terms of Payment", col1RightX, rightY);
  doc.text("Reference No. & Date", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.paymentTerms || "PT", col1RightX, rightY);
  doc.text(invoice.refNo || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Buyer's Order No.", col1RightX, rightY);
  doc.text("Other References", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.buyerOrderNo || "", col1RightX, rightY);
  doc.text(invoice.otherRefs || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Dispatch Doc No.", col1RightX, rightY);
  doc.text("Dispatched through", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.dispatchNo || "", col1RightX, rightY);
  doc.text(invoice.dispatchedThrough || "PT", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Destination", col1RightX, rightY);
  doc.text("Bill of Lading/LR-RR No.", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.toLoc || "", col1RightX, rightY);
  doc.text(invoice.blNo || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Motor Vehicle No.", col1RightX, rightY);
  doc.text("Driver Name", col2RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.vehicleDesc || "", col1RightX, rightY);
  doc.text(invoice.driverName || "", col2RightX, rightY);
  rightY += 2;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Terms of Delivery", col1RightX, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  doc.text("FOR", col1RightX, rightY);
  rightY += 10;

  drawDividerLine(rightY);
  rightY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("GST Payable under Reverse Charge : NO", col1RightX, rightY);

  // Draw vertical divider line for the right section
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(rightSectionDividerX, boxStartY, rightSectionDividerX, rightY - 22);
};

/**
 * Generate E-Way Bill PDF only (without Tax Invoice)
 */
export const generateEwayBillOnlyPDF = async (data) => {
  const { seller, buyer, invoice, items, ewayBill } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;
  let page2Y = margin;

  // ========== PAGE HEADER ==========
  const page2LeftX = margin;
  let page2LeftY = page2Y + 6;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    "e-Way Bill",
    page2LeftX + (pageWidth - 2 * margin) / 2,
    page2LeftY,
    { align: "center" },
  );
  page2LeftY += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Doc No.: ${invoice.docNo || ""}`, page2LeftX, page2LeftY);
  page2LeftY += 5;
  doc.text(
    `Date: ${invoice.docDate ? formatDate(invoice.docDate) : ""}`,
    page2LeftX,
    page2LeftY,
  );
  page2LeftY += 7;

  doc.setFontSize(8);
  doc.text(`IRN: ${invoice.irn || ""}`, page2LeftX, page2LeftY);
  page2LeftY += 5;
  doc.text(`Ack No.: ${invoice.ackNo || ""}`, page2LeftX, page2LeftY);
  page2LeftY += 5;
  doc.text(
    `Ack Date: ${invoice.ackDate ? formatDate(invoice.ackDate) : ""}`,
    page2LeftX,
    page2LeftY,
  );

  // QR Code on Page
  const page2QrSize = 40;
  const page2QrX = pageWidth - margin - page2QrSize;
  const page2QrY = page2Y + 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("e-Way Bill", pageWidth - margin - page2QrSize / 2, page2Y + 6, {
    align: "center",
  });

  try {
    const ewbNo = (invoice.ewayBillNo || ewayBill?.ewayBillNo || "").substring(
      0,
      15,
    );
    const gstin = (seller?.gstin || invoice?.gstin || "").substring(0, 15);
    const docDate = invoice.docDate ? formatDate(invoice.docDate) : "";

    const qrText = `${ewbNo}|${gstin}|${docDate}`;

    if (qrText && qrText !== "||") {
      const qrDataURL = await generateQRCodeDataURL(qrText);
      if (qrDataURL) {
        doc.addImage(
          qrDataURL,
          "PNG",
          page2QrX,
          page2QrY,
          page2QrSize,
          page2QrSize,
        );
      }
    }
  } catch (err) {
    console.error("QR Code error:", err);
  }

  page2Y += 52;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y, pageWidth - margin, page2Y);

  // ========== 1. E-WAY BILL DETAILS ==========
  page2Y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("1. e-Way Bill Details", margin, page2Y);
  page2Y += 6;

  let ewayRowY = page2Y;
  const col1 = margin;
  const col2 = margin + 65;
  const col3 = margin + 130;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(`e-Way Bill No.: ${invoice.ewayBillNo || ""}`, col1, ewayRowY);
  doc.text(`Mode: ${ewayBill?.mode || "1 - Road"}`, col2, ewayRowY);
  doc.text(
    `Generated Date: ${ewayBill?.generatedDate ? formatDateTime(ewayBill.generatedDate) : ""}`,
    col3,
    ewayRowY,
  );
  ewayRowY += 5;

  doc.text(`Generated By: ${invoice.gstin || ""}`, col1, ewayRowY);
  doc.text(
    `Approx Distance: ${ewayBill?.approxDistance || ""}`,
    col2,
    ewayRowY,
  );
  doc.text(
    `Valid Upto: ${ewayBill?.validUpto ? formatDate(ewayBill.validUpto) : ""}`,
    col3,
    ewayRowY,
  );
  ewayRowY += 5;

  doc.text(
    `Supply Type: ${ewayBill?.supplyType || "Outward-Supply"}`,
    col1,
    ewayRowY,
  );
  doc.text(
    `Transaction Type: ${ewayBill?.transactionType || "Bill From - Dispatch From"}`,
    col2,
    ewayRowY,
  );

  page2Y = ewayRowY + 8;

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

  // ========== 2. ADDRESS DETAILS ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("2. Address Details", margin, page2Y);
  page2Y += 6;

  const leftColX = margin + 5;
  const rightStartX = pageWidth / 2 + 5;
  let addrLeftY = page2Y;
  let addrRightY = page2Y;

  // Left Column - From
  doc.setFont("helvetica", "bold");
  doc.text("From", leftColX, addrLeftY);
  addrLeftY += 5;
  doc.setFont("helvetica", "normal");

  const fromLines = wrapTextForCell(seller.lglNm || "", 50);
  fromLines.forEach((line) => {
    doc.text(line, leftColX, addrLeftY);
    addrLeftY += 4;
  });
  doc.text(`GSTIN : ${seller.gstin || ""}`, leftColX, addrLeftY);
  addrLeftY += 4;
  doc.text(`${seller.loc || ""}`, leftColX, addrLeftY);
  addrLeftY += 8;

  // Left Column - Dispatch From
  doc.setFont("helvetica", "bold");
  doc.text("Dispatch From", leftColX, addrLeftY);
  addrLeftY += 5;
  doc.setFont("helvetica", "normal");

  const dispatchLines = wrapTextForCell(
    seller.dispatchAddr || seller.addr1 || "",
    55,
  );
  dispatchLines.forEach((line) => {
    doc.text(line, leftColX, addrLeftY);
    addrLeftY += 4;
  });
  doc.text(
    `${seller.pin || ""} ${seller.stateName || ""}`,
    leftColX,
    addrLeftY,
  );

  // Right Column - To
  doc.setFont("helvetica", "bold");
  doc.text("To", rightStartX, addrRightY);
  addrRightY += 5;
  doc.setFont("helvetica", "normal");

  const toLines = wrapTextForCell(buyer.lglNm || "", 50);
  toLines.forEach((line) => {
    doc.text(line, rightStartX, addrRightY);
    addrRightY += 4;
  });
  doc.text(`GSTIN : ${buyer.gstin || ""}`, rightStartX, addrRightY);
  addrRightY += 4;
  doc.text(`${buyer.loc || ""}`, rightStartX, addrRightY);
  addrRightY += 8;

  // Right Column - Ship To
  doc.setFont("helvetica", "bold");
  doc.text("Ship To", rightStartX, addrRightY);
  addrRightY += 5;
  doc.setFont("helvetica", "normal");

  const shipLines = wrapTextForCell(buyer.shipAddr || buyer.addr1 || "", 45);
  shipLines.forEach((line) => {
    doc.text(line, rightStartX, addrRightY);
    addrRightY += 4;
  });
  doc.text(
    `${buyer.stateName || ""} ${buyer.pin || ""}`,
    rightStartX,
    addrRightY,
  );

  page2Y = Math.max(addrLeftY, addrRightY) + 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

  // ========== 3. GOODS DETAILS ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("3. Goods Details", margin, page2Y);
  page2Y += 6;

  const goodsColumns = [
    { header: "Product Name & Desc Code", dataKey: "product", width: 60 },
    { header: "Quantity", dataKey: "qty", width: 25 },
    { header: "Taxable Amt", dataKey: "taxableAmt", width: 30 },
    { header: "Tax Rate (C+S)", dataKey: "taxRate", width: 30 },
  ];

  const goodsBody = items.map((item) => ({
    product: `${item.item_HsnCd || ""} ${item.item_PrdDesc || ""}`,
    qty: `${item.item_Qty || "0"} ${item.item_Unit || "PCS"}`,
    taxableAmt: formatAmount(item.item_AssAmt),
    taxRate: `${parseFloat(item.item_GstRt || 0) / 2}+${parseFloat(item.item_GstRt || 0) / 2}`,
  }));

  autoTable(doc, {
    startY: page2Y,
    columns: goodsColumns,
    body: goodsBody,
    margin: { left: margin + 2, right: margin + 2 },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: "middle",
      fontStyle: "normal",
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [230, 232, 235],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontStyle: "normal",
      lineWidth: 0.1,
    },
    columnStyles: {
      product: { halign: "left" },
      qty: { halign: "right" },
      taxableAmt: { halign: "right" },
      taxRate: { halign: "center" },
    },
  });

  if (!doc.previousAutoTable) {
    page2Y += 30;
  } else {
    page2Y = doc.previousAutoTable.finalY + 5;
  }

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y, pageWidth - margin, page2Y);

  // ========== TOTALS SECTION ==========
  page2Y += 4;
  const totalTaxableAmt = goodsBody.reduce(
    (sum, item) => sum + parseFloat(item.taxableAmt.replace(/,/g, "") || 0),
    0,
  );
  const totalCgstAmt = totalTaxableAmt; //* 0.025;
  const totalSgstAmt = totalTaxableAmt; //* 0.025;
  const totalInvAmt = totalTaxableAmt + totalCgstAmt + totalSgstAmt;

  const col1X = margin + 5;
  const col2X = margin + 70;
  const col3X = margin + 130;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Tot.Taxable Amt    : ${formatAmount(totalTaxableAmt)}`,
    col1X,
    page2Y,
  );
  doc.text(`Other Amt    : (-)0.42`, col2X, page2Y);
  page2Y += 5;

  doc.text(`CGST Amt    : ${formatAmount(totalCgstAmt)}`, col1X, page2Y);
  doc.text(`SGST Amt    : ${formatAmount(totalSgstAmt)}`, col2X, page2Y);
  page2Y += 5;

  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Inv Amt    : ${formatAmount(totalInvAmt)}`,
    col3X,
    page2Y - 5,
  );
  page2Y += 5;
  doc.setFont("helvetica", "normal");

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

  // ========== 4. TRANSPORTATION DETAILS ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("4. Transportation Details", margin, page2Y);
  page2Y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Transporter ID    : ${invoice?.transporterId || ""}`,
    col1X,
    page2Y,
  );
  page2Y += 5;
  doc.text(`Name    : ${invoice?.driverName || ""}`, col1X, page2Y);
  page2Y += 5;
  doc.text(`Doc No.    : ${invoice?.docNo || ""}`, col3X, page2Y - 10);
  page2Y += 5;
  doc.text(
    `Date    : ${invoice?.docDate ? formatDate(invoice.docDate) : ""}`,
    col3X,
    page2Y - 10,
  );

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

  // ========== 5. VEHICLE DETAILS ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("5. Vehicle Details", margin, page2Y);
  page2Y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(`Vehicle No.    : ${invoice?.vehicleDesc || ""}`, col1X, page2Y);
  doc.text(`From    : ${invoice?.fromLoc || ""}`, col2X, page2Y);
  page2Y += 5;
  doc.text(`CEWB No.: ${invoice?.cewbNo || ""}`, col3X, page2Y - 5);

  // ========== SAVE PDF ==========
  const fileName = `E-Way_Bill_${invoice.docNo || invoice.deliveryNo || "invoice"}.pdf`;
  doc.save(fileName);

  return fileName;
};

/**
 * Generate GST Invoice PDF - Single Box Layout with Left and Right Sections
 */
export const generateGSTInvoicePDF = async (
  data,
  printType = "ORIGINAL",
  includeEwayBill = true,
  ewayBillOnly = false,
) => {
  const { seller, buyer, invoice, items, totals, ewayBill } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;
  let yPos = margin;

  // Determine the document type label based on printType
  const getDocTypeLabel = () => {
    switch (printType) {
      case "DUPLICATE":
        return "(DUPLICATE FOR TRANSPORTER)";
      case "TRIPLICATE":
        return "(TRIPLICATE FOR SUPPLIER)";
      default:
        return "(ORIGINAL FOR RECIPIENT)";
    }
  };

  // ========== TAX INVOICE SECTION (skip if ewayBillOnly is true) ==========
  if (!ewayBillOnly) {
    // =================== PAGE 1 - TAX INVOICE ===================

    // ========== HEADER SECTION WITH BORDER BOX ==========
    const headerBoxStartY = yPos;
    const headerBoxHeight = 50;
    const headerBoxWidth = pageWidth - 2 * margin;

    // Draw header box border
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, headerBoxStartY, headerBoxWidth, headerBoxHeight);

    // ========== LEFT SIDE CONTENT ==========
    const leftHeaderX = margin + 3;
    let leftHeaderY = headerBoxStartY + 5;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Tax Invoice", leftHeaderX + 50, leftHeaderY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(getDocTypeLabel(), leftHeaderX + 80, leftHeaderY);

    // Divider line below header
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, leftHeaderY + 2, pageWidth - margin - 45, leftHeaderY + 2);
    leftHeaderY += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "(Issued under Rule 46 of CGST Rules 2017 read with Section 31 of CGST Act 2017)",
      leftHeaderX,
      leftHeaderY,
    );
    leftHeaderY += 20;

    // ========== IRN, ACK No, ACK Date SECTION ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`IRN: ${invoice.irn || ""}`, leftHeaderX, leftHeaderY);
    leftHeaderY += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`Ack No.: ${invoice.ackNo || ""}`, leftHeaderX, leftHeaderY);
    leftHeaderY += 6;
    doc.text(
      `Ack Date: ${invoice.ackDate ? formatDate(invoice.ackDate) : ""}`,
      leftHeaderX,
      leftHeaderY,
    );
    leftHeaderY += 4;

    // ========== RIGHT SIDE CONTENT (e-Invoice & QR) ==========
    const rightHeaderX = pageWidth - margin - 28;
    let rightHeaderY = headerBoxStartY + 5;

    // e-Invoice text
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("e-Invoice", rightHeaderX + 2, rightHeaderY - 2);
    rightHeaderY += 6;

    // QR Code
    const qrSize = 40;
    const qrX = pageWidth - margin - 3 - qrSize;
    const qrY = headerBoxStartY + headerBoxHeight - qrSize - 5;

    if (invoice.signedQRCode || invoice.irn || invoice.docNo) {
      try {
        let qrText = invoice.signedQRCode;

        if (!qrText) {
          const docNo = invoice.docNo || invoice.deliveryNo || "";
          const irn = invoice.irn || "";
          const ackNo = invoice.ackNo || "";
          const docDate = invoice.docDate ? formatDate(invoice.docDate) : "";
          qrText = `${docNo}|${irn}|${ackNo}|${docDate}`;
          if (qrText === "|||") {
            qrText = invoice.deliveryNo || "GST_Invoice";
          }
        }

        if (qrText && qrText.trim() !== "") {
          const qrDataURL = await generateQRCodeDataURL(qrText);
          if (qrDataURL) {
            doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);
          }
        }
      } catch (error) {
        console.error("QR Code error:", error);
      }
    }

    // Update yPos after header box
    yPos = headerBoxStartY + headerBoxHeight + 2;

    // ========== MAIN BORDERED BOX ==========
    const boxStartY = yPos;
    const boxHeight = 115;
    const boxWidth = pageWidth - 2 * margin;

    // Draw main box border
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, boxStartY, boxWidth, boxHeight);

    // Draw vertical divider line in the middle
    const dividerX = margin + boxWidth / 2;
    doc.line(dividerX, boxStartY, dividerX, boxStartY + boxHeight);

    // ========== LEFT SECTION (Seller, Receiver, Delivery) ==========
    const leftX = margin + 3;
    const rightX = dividerX + 3;
    let leftY = boxStartY + 5;
    let rightY = boxStartY + 5;
    const maxCharsPerLines = 50;

    // ---------- Seller (Bill from) Section ----------
    // doc.setFontSize(9);
    // doc.setFont("helvetica", "bold");
    // doc.text("Seller (Bill from)", leftX, leftY);
    // leftY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);

    const sellerNameLines = wrapText(seller.lglNm || "", maxCharsPerLines);
    sellerNameLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const sellerAddrFull = `${seller.addr1 || ""} ${seller.addr2 || ""}`.trim();
    const sellerAddrLines = wrapText(sellerAddrFull, maxCharsPerLines);
    sellerAddrLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    const sellerLocLines = wrapText(seller.loc || "", maxCharsPerLines);
    sellerLocLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.text(`GSTIN/UIN: ${seller.gstin || ""}`, leftX, leftY);
    leftY += 4.5;
    doc.text(
      `State Name: ${seller.stateName || ""}, Code: ${seller.stcd || ""}`,
      leftX,
      leftY,
    );
    leftY += 4;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(leftX - 3, leftY, dividerX, leftY);
    leftY += 4;

    // ---------- Receiver (Bill to) Section ----------
    doc.setFont("helvetica", "normal");
    doc.text("Receiver (Bill to):", leftX, leftY);
    leftY += 4.5;

    doc.setFont("helvetica", "bold");
    const buyerNameLines = wrapText(buyer.lglNm || "", maxCharsPerLines);
    buyerNameLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const buyerAddrLines = wrapText(`${buyer.addr1 || ""}`, maxCharsPerLines);
    buyerAddrLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    const buyerAddr2Lines = wrapText(`${buyer.addr2 || ""}`, maxCharsPerLines);
    buyerAddr2Lines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.text(`GSTIN/UIN: ${buyer.gstin || ""}`, leftX, leftY);
    leftY += 4.5;
    doc.text(
      `State Name: ${buyer.stateName || ""}, Code: ${buyer.stcd || ""}`,
      leftX,
      leftY,
    );
    leftY += 4.5;
    doc.text(`Place of Supply: ${buyer.stateName || ""}`, leftX, leftY);
    leftY += 4;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(leftX - 3, leftY, dividerX, leftY);
    leftY += 4;

    // ---------- Delivery (Ship to) Section ----------
    doc.setFont("helvetica", "normal");
    doc.text("Delivery (Ship to):", leftX, leftY);
    leftY += 4.5;

    doc.setFont("helvetica", "bold");
    const shipNameLines = wrapText(buyer.lglNm || "", maxCharsPerLines);
    shipNameLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const shipAddrLines = wrapText(`${buyer.addr1 || ""}`, maxCharsPerLines);
    shipAddrLines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    const shipAddr2Lines = wrapText(`${buyer.addr2 || ""}`, maxCharsPerLines);
    shipAddr2Lines.forEach((line) => {
      doc.text(line, leftX, leftY);
      leftY += 4.5;
    });

    doc.text(`GSTIN/UIN: ${buyer.gstin || ""}`, leftX, leftY);
    leftY += 4.5;
    doc.text(
      `State Name: ${buyer.stateName || ""}, Code: ${buyer.stcd || ""}`,
      leftX,
      leftY,
    );

    yPos = boxStartY + boxHeight + 2;

    // ========== RIGHT SECTION (Invoice Details) ==========
    const rightSectionWidth = boxWidth / 2 - 6;
    const rightSectionDividerX = rightX + rightSectionWidth / 2;
    const col1RightX = rightX;
    const col2RightX = rightSectionDividerX + 4;

    const rightSectionTopY = rightY;

    const drawDividerLine = (yPosition) => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(rightX, yPosition, pageWidth - margin, yPosition);
    };

    // Row 1: Invoice No. & e-Way Bill No.
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No.", col1RightX, rightY);
    doc.text("e-Way Bill No.", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.docNo || "", col1RightX, rightY);
    doc.text(invoice.ewayBillNo || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 2: Dated & Delivery Note
    doc.setFont("helvetica", "bold");
    doc.text("Dated", col1RightX, rightY);
    doc.text("Delivery Note", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(
      invoice.docDate ? formatDate(invoice.docDate) : "",
      col1RightX,
      rightY,
    );
    // doc.text(invoice.deliveryNo || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 3: Mode/Terms of Payment & Reference No. & Date
    doc.setFont("helvetica", "bold");
    doc.text("Mode/Terms of Payment", col1RightX, rightY);
    doc.text("Reference No. & Date", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.paymentTerms || "", col1RightX, rightY);
    doc.text(invoice.refNo || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 4: Buyer's Order No. & Other References
    doc.setFont("helvetica", "bold");
    doc.text("Buyer's Order No.", col1RightX, rightY);
    doc.text("Other References", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.buyerOrderNo || "", col1RightX, rightY);
    doc.text(invoice.otherRefs || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 5: Dispatch Doc No. & Dispatched through
    doc.setFont("helvetica", "bold");
    doc.text("Dispatch Doc No.", col1RightX, rightY);
    doc.text("Dispatched through", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.dispatchNo || "", col1RightX, rightY);
    doc.text(invoice.dispatchedThrough || "PT", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 6: Destination & Bill of Lading/LR-RR No.
    doc.setFont("helvetica", "bold");
    doc.text("Destination", col1RightX, rightY);
    doc.text("Bill of Lading/LR-RR No.", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.toLoc || "", col1RightX, rightY);
    doc.text(invoice.blNo || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    // Row 7: Motor Vehicle No. & Driver Name
    doc.setFont("helvetica", "bold");
    doc.text("Motor Vehicle No.", col1RightX, rightY);
    doc.text("Driver Name", col2RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text(invoice.vehicleDesc || "", col1RightX, rightY);
    doc.text(invoice.driverName || "", col2RightX, rightY);
    rightY += 2;

    drawDividerLine(rightY);
    rightY += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Terms of Delivery", col1RightX, rightY);
    rightY += 4;

    doc.setFont("helvetica", "normal");
    doc.text("FOR", col1RightX, rightY);
    rightY += 10;

    drawDividerLine(rightY);
    rightY += 4;

    doc.setFont("helvetica", "bold");
    doc.text("GST Payable under Reverse Charge : NO", col1RightX, rightY);
    rightY += 4;

    // Draw full vertical divider line for the right details section
    const rightSectionBottomY = rightY;
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(
      rightSectionDividerX,
      rightSectionTopY - 5,
      rightSectionDividerX,
      rightSectionBottomY - 26,
    );

    // =========================================================================
    // ITEMS TABLE — with per-page header + main bordered box
    // =========================================================================
    // Layout on EVERY page:
    //   margin (4mm)
    //   ┌─ Header box (50mm) ──────────────────────────────────────────────┐
    //   │  Tax Invoice title / IRN / Ack No / Ack Date / e-Invoice label  │
    //   └──────────────────────────────────────────────────────────────────┘
    //   ┌─ Main bordered box (115mm) ──────────────────────────────────────┐
    //   │  Seller / Buyer / Invoice details                                │
    //   └──────────────────────────────────────────────────────────────────┘
    //   Item table rows  (fills remaining space on the page)
    //   [last page only] footer + signature section
    // =========================================================================

    // Page 1 header height = 50 mm (large box with IRN/QR — already drawn above)
    // Continuation header height = ~20 mm (plain text only, no rect border)
    const CONT_HEADER_H = 20; // title line + divider + rule text
    const MAINBOX_H = 115; // seller/buyer bordered box (same on every page)
    const BOX_GAP = 2; // gap between continuation header and main box

    // Y where item table rows start on continuation pages WITH the full bordered box
    //   margin(4) + CONT_HEADER_H(20) + BOX_GAP(2) + MAINBOX_H(115) + gap(2) = 143 mm
    const TABLE_START_Y = margin + CONT_HEADER_H + BOX_GAP + MAINBOX_H + 2;

    // Y where item table rows start on the LAST page (compact header only, NO bordered box)
    //   margin(4) + CONT_HEADER_H(20) + gap(2) = 26 mm
    const TABLE_START_Y_FOOTER = margin + CONT_HEADER_H + 2;

    const taxInvoiceSummaryReserve = 75; // mm reserved for footer on last page

    // Track which pages should get the full layout (header + bordered box)
    // vs just the compact header. Page 1 is already drawn manually.
    // We use a two-state approach:
    //   - If a new page has enough room to show items AND the footer below TABLE_START_Y_FOOTER,
    //     we use compact header (no bordered box) → more items fit.
    //   - Otherwise use full layout.
    // In practice: last autoTable page → compact header only.
    // We track this by counting pages as willDrawPage fires.
    let isLastTablePage = false; // updated in didDrawCell to detect when table ends

    // drawPageLayout — called by willDrawPage for pages 2, 3, 4 …
    // Draws a compact plain-text header (no rect border, no IRN/Ack)
    // then (optionally) the full seller/buyer main bordered box below it.
    // Pass drawBox=false on the last/footer page so rows start higher up.
    const drawPageLayout = (pageNum, drawBox = true) => {
      const hLeftX = margin + 3;
      let hY = margin + 5;

      // ── Title centered, doc-type label on the right ─────────────────────
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Tax Invoice (Page ${pageNum})`, pageWidth / 2, hY, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(getDocTypeLabel(), pageWidth - margin - 2, hY, {
        align: "right",
      });

      // ── Full-width divider line below the title ──────────────────────────
      hY += 2;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin, hY + 2, pageWidth - margin, hY + 2);
      hY += 6;

      // ── CGST rule text centred ───────────────────────────────────────────
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "(Issued under Rule 46 of CGST Rules 2017 read with Section 31 of CGST Act 2017)",
        pageWidth / 2,
        hY,
        { align: "center" },
      );

      if (!drawBox) return; // footer page: skip the bordered box entirely

      // ── Main bordered box: seller / buyer / invoice details ─────────────
      const mainBoxStartY = margin + CONT_HEADER_H + BOX_GAP;
      drawCompleteBorderedBox(
        doc,
        pageWidth,
        margin,
        mainBoxStartY,
        seller,
        buyer,
        invoice,
      );
    };

    // autoTable column definitions
    const tableColumns = [
      { header: "SI No.", dataKey: "slno", width: 10 },
      { header: "Description of Goods", dataKey: "description", width: 55 },
      { header: "HSN/SAC", dataKey: "hsn", width: 15 },
      { header: "Shipped", dataKey: "shipped", width: 12 },
      { header: "Discount", dataKey: "discount", width: 12 },
      { header: "Billed", dataKey: "billed", width: 12 },
      { header: "GST Rate", dataKey: "gstRate", width: 12 },
      { header: "Rate (inc. of tax)", dataKey: "rateIncTax", width: 18 },
      { header: "Rate", dataKey: "rate", width: 18 },
      { header: "Per", dataKey: "per", width: 12 },
      { header: "Amount", dataKey: "amount", width: 20 },
    ];

    const tableBody = items.map((item, idx) => ({
      slno: String(idx + 1),
      description: item.item_PrdDesc || "",
      hsn: item.item_HsnCd || "",
      shipped: `${item.item_ShipQty || "0"}`,
      discount: `${item.item_FreeQty || "0"}`,
      billed: `${item.item_Qty || "0"}`,
      gstRate: `${item.item_GstRt || "0"}%`,
      rateIncTax: formatAmount(getRateIncTax(item)),
      rate: formatAmount(item.item_UnitPrice || 0),
      per: item.item_Unit || "",
      amount: formatAmount(item.item_TotAmt),
    }));

    let finalTableY = yPos;
    let finalTableLastPage = doc.getNumberOfPages();

    autoTable(doc, {
      columns: tableColumns,
      body: tableBody,
      startY: yPos, // page 1: table starts right after the already-drawn boxes
      margin: {
        left: margin,
        right: margin,
        top: TABLE_START_Y, // pages 2+: autoTable respects this as top margin
        bottom: margin, // NO reserved footer space — footer is drawn after table ends
      },
      pageBreak: "auto",
      rowPageBreak: "avoid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: "middle",
        fontStyle: "normal",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [230, 232, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontStyle: "normal",
        lineWidth: 0.1,
      },
      columnStyles: {
        slno: { halign: "center" },
        description: { halign: "left" },
        hsn: { halign: "center" },
        shipped: { halign: "right" },
        discount: { halign: "right" },
        billed: { halign: "right" },
        gstRate: { halign: "center" },
        rateIncTax: { halign: "right" },
        rate: { halign: "right" },
        per: { halign: "center" },
        amount: { halign: "right" },
      },
      // willDrawPage fires on EVERY page autoTable uses, BEFORE any rows are drawn.
      // Page 1 layout is already drawn — skip it.
      // Pages 2+ always get full layout (compact header + bordered box).
      // The footer is drawn AFTER the table ends, with ensureTaxInvoiceSpace handling overflow.
      willDrawPage: (data) => {
        const pageNum = doc.getNumberOfPages();
        if (pageNum === 1) return; // already drawn
        drawPageLayout(pageNum, true); // always full layout on continuation pages
        data.cursor.y = TABLE_START_Y;
      },
      didDrawCell: (data) => {
        if (data.section === "body") {
          finalTableY = Math.max(finalTableY, data.cell.y + data.cell.height);
          finalTableLastPage = doc.getNumberOfPages();
        }
      },
    });

    if (doc.previousAutoTable) {
      finalTableY = doc.previousAutoTable.finalY;
      finalTableLastPage = doc.getNumberOfPages();
    }

    // Make sure we are on the last table page before checking space / drawing footer
    if (finalTableLastPage && doc.internal.getCurrentPageInfo) {
      const curPage = doc.internal.getCurrentPageInfo().pageNumber;
      if (finalTableLastPage !== curPage) {
        doc.setPage(finalTableLastPage);
      }
    }

    yPos = finalTableY + 4;

    // Safety: if footer doesn't fit on the last table page, add a new page.
    // That overflow page gets: compact header + full bordered box + table column
    // header row (no data rows) + footer below.
    const ensureTaxInvoiceSpace = (requiredHeight) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (yPos + requiredHeight <= pageHeight - margin) return;
      doc.addPage();
      const newPageNum = doc.getNumberOfPages();
      // Draw full layout (header + bordered box) on the overflow/footer page
      drawPageLayout(newPageNum, true);
      // Draw just the table column header row (no body rows) so columns are visible
      autoTable(doc, {
        columns: tableColumns,
        body: [], // no data rows — header only
        startY: TABLE_START_Y,
        margin: {
          left: margin,
          right: margin,
          top: TABLE_START_Y,
          bottom: margin,
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [230, 232, 235],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
          valign: "middle",
          lineWidth: 0.1,
        },
        columnStyles: {
          slno: { halign: "center" },
          description: { halign: "left" },
          hsn: { halign: "center" },
          shipped: { halign: "right" },
          discount: { halign: "right" },
          billed: { halign: "right" },
          gstRate: { halign: "center" },
          rateIncTax: { halign: "right" },
          rate: { halign: "right" },
          per: { halign: "center" },
          amount: { halign: "right" },
        },
      });
      // Start footer right below the empty table header
      yPos = (doc.previousAutoTable?.finalY || TABLE_START_Y + 8) + 2;
    };

    const totalShipped = items.reduce(
      (sum, item) => sum + parseFloat(item.item_ShipQty || 0),
      0,
    );

    const totalDiscount = items.reduce(
      (sum, item) => sum + parseFloat(item.item_Discount || 0),
      0,
    );

    const totalBilled = items.reduce(
      (sum, item) => sum + parseFloat(item.item_Qty || 0),
      0,
    );

    const totalAmount = items.reduce(
      (sum, item) => sum + (Number(item?.item_TotAmt) || 0),
      0,
    );
    const totalAmountRounded = Math.round(totalAmount * 100) / 100;

    // Compute column start positions based on table column widths so totals align dynamically
    const colWidths = tableColumns.map((c) => c.width || 0);
    const colStarts = [];
    let accX = margin;
    for (let w of colWidths) {
      colStarts.push(accX);
      accX += w;
    }

    ensureTaxInvoiceSpace(taxInvoiceSummaryReserve);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");

    // ========== FOOTER BOX (Amount in words left, totals right) ==========
    const footerBoxHeight = 17;
    const footerY = yPos; // yPos was updated by ensureTaxInvoiceSpace if new page needed
    const footerWidth = pageWidth - 2 * margin;
    const footerMidX = margin + footerWidth / 2 - 10.5;
    // const totalAmountInWords = numberToWords(totalAmount);

    const totalTaxable = parseFloat(totals.assVal) || 0;
    const totalCgst = parseFloat(totals.cgstVal) || 0;
    const totalSgst = parseFloat(totals.sgstVal) || 0;
    const totalIgst = parseFloat(totals.igstVal) || 0;
    const netTotalValue = parseFloat(totals.totalInvVal2) || 0;
    const totalTax = totalCgst + totalSgst + totalIgst;
    // const grandTotalWithTax = totalTaxable + totalTax;

    // const netTotalValue = items.reduce(
    //   (s, it) => s + (parseFloat(it.item_TotItemVal2) || 0),
    //   0,
    // );
    const totalAmountInWords = numberToWords(netTotalValue);

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, footerY, footerWidth, footerBoxHeight);
    doc.setLineWidth(0.2);
    doc.line(footerMidX, footerY, footerMidX, footerY + footerBoxHeight);

    // Left side: Amount Chargeable (in words)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const leftTextX = margin + 2;
    let leftTextY = footerY + 4;

    doc.setFont("helvetica", "normal");
    doc.text("Amount Chargeable (in words):", leftTextX, leftTextY);
    leftTextY += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const leftLines = wrapText(
      `INR ${totalAmountInWords}`,
      50,
      Math.floor(footerWidth / 2) - 10,
    );
    leftLines.forEach((ln) => {
      doc.text(ln, leftTextX, leftTextY);
      leftTextY += 4.5;
    });

    // Right side: Tax, Rounded Off and Net Total
    const rightTextX = footerMidX + 8;
    let rightTextY = footerY + 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Top-right: show shipped/discount/billed counts/totals in the footer
    const rightTopY = footerY + 3;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(String(totalShipped), rightTextX, rightTopY);
    doc.text(formatAmount(totalDiscount), rightTextX + 10, rightTopY);
    doc.text(String(totalBilled), rightTextX + 25, rightTopY);
    doc.text(
      formatAmount(totalAmountRounded),
      pageWidth - margin - 2,
      rightTextY - 4,
      {
        align: "right",
      },
    ); //rightTextX + 90, rightTopY);

    // continue below with tax/round/net
    rightTextY = footerY + 8;
    doc.setFontSize(8);
    doc.text("Tax:", rightTextX, rightTextY);
    doc.text(formatAmount(totalTax), pageWidth - margin - 2, rightTextY, {
      align: "right",
    });
    rightTextY += 4;
    doc.text("Rounded Off:", rightTextX, rightTextY);
    const roundOff =
      parseFloat(
        totals?.roundOff ||
          totals?.roundoff ||
          totals?.item_RoundOff ||
          invoice?.ROUNDOFF ||
          invoice?.roundOff ||
          0,
      ) ||
      items.reduce(
        (s, it) => s + (parseFloat(it.item_RoundOff || it.ROUNDOFF || 0) || 0),
        0,
      );
    doc.text(formatAmount(roundOff), pageWidth - margin - 2, rightTextY, {
      align: "right",
    });
    rightTextY += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Net Total:", rightTextX, rightTextY);
    doc.text(formatAmount(netTotalValue), pageWidth - margin - 2, rightTextY, {
      align: "right",
    });

    // advance yPos past footer box
    yPos = footerY + footerBoxHeight + 6;

    // ========== TOTALS TABLE & AMOUNT IN WORDS (boxed) ==========
    const boxHeightTm = 17;
    const boxY = footerY + footerBoxHeight; //+ 2
    const boxWidthTm = pageWidth - 2 * margin;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, boxY, boxWidthTm, boxHeightTm);

    // Calculate widths: 35% for amount section, remaining for table section
    const amountSectionWidth = boxWidthTm * 0.45 - 0.5;

    // Draw vertical divider line between sections
    const dividerXs = margin + amountSectionWidth;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(dividerXs, boxY, dividerXs, boxY + boxHeightTm);

    // Left side: Amount in words (35% width)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const boxLeftX = margin + 2;
    const boxLeftY = boxY + 4;
    doc.text("Tax Amount (in words)  :", boxLeftX, boxLeftY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const compactWords = wrapText(
      // `INR ${numberToWords(grandTotalWithTax)}`,
      `INR ${numberToWords(totalTax)}`,
      50,
      Math.floor(amountSectionWidth) - 15,
    );
    // Print amount-in-words to fit the left half
    compactWords.slice(0, 2).forEach((line, idx) => {
      doc.text(line, boxLeftX, boxLeftY + 6 + idx * 5);
    });

    // Right side: totals table with borders (65% width)
    // Reduced column widths to fit within 65% section
    const colWidthsTm = [26, 20, 20, 20, 25.5]; // Reduced from [35,25,25,25,25]
    const totalsHead = [
      ["Taxable", "CGST", "SGST", "IGST", "Total Tax Amount"],
    ];
    const totalsRow = [
      formatAmount(totalTaxable),
      formatAmount(totalCgst),
      formatAmount(totalSgst),
      formatAmount(totalIgst),
      formatAmount(totalTax),
    ];

    const totalsTableWidth = colWidthsTm.reduce((s, w) => s + w, 0);
    // Position table within the right section
    const rightSectionStartX = dividerXs;
    // const rightSectionWidth = tableSectionWidth;
    const rightStartX = rightSectionStartX; // Add small left padding

    autoTable(doc, {
      startY: boxY,
      startX: rightStartX, // Center table in right section
      theme: "grid",
      margin: { left: rightStartX, right: margin },
      styles: {
        font: "helvetica",
        fontSize: 8, // Reduced font size slightly
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 1.5,
      },
      head: totalsHead,
      body: [totalsRow],
      tableWidth: totalsTableWidth,
      headStyles: {
        fillColor: [230, 232, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8.5,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontStyle: "normal",
        fontSize: 9.5,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: colWidthsTm[0], halign: "center" },
        1: { cellWidth: colWidthsTm[1], halign: "center" },
        2: { cellWidth: colWidthsTm[2], halign: "center" },
        3: { cellWidth: colWidthsTm[3], halign: "center" },
        4: { cellWidth: colWidthsTm[4], halign: "center" },
      },
      didDrawCell: function (data) {
        // Bold the Total column values
        if (data.row.index === 0 && data.column.index === 4) {
          doc.setFont("helvetica", "bold");
        }
      },
    });

    //=================  COMPANY BANK DETAILS & TERMS & CONDITIONS (side by side) ==============
    // move yPos below box
    yPos = boxY + boxHeightTm;
    const compX = rightStartX + 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const companyDetailsStartY = yPos + 6;
    doc.text("Company's Bank Details", compX, companyDetailsStartY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const compYStart = companyDetailsStartY + 4;
    let compY = compYStart;
    doc.text(
      `A/c Holder's Name : ${invoice.bankAccountHolderName || ""}`,
      compX,
      compY,
    );
    compY += 5;
    doc.text(`Bank Name         : ${invoice.bankName || ""}`, compX, compY);
    compY += 5;
    doc.text(`A/c No.           : ${invoice.accountNo || ""}`, compX, compY);
    compY += 5;
    doc.text(
      `Branch & IFS Code : ${invoice.branchIfscCode || ""}`,
      compX,
      compY,
    );

    // ========== TERMS AND CONDITIONS ==========
    let termsY = Math.max(yPos, compY) + 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Company's PAN : ${invoice.company || ""}`,
      margin + 4,
      termsY - 20,
    );
    termsY += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Declaration:", margin + 4, termsY - 20);
    termsY += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "We declare that this invoice shows the actual price of the goods",
      margin + 4,
      termsY - 20,
    );
    termsY += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "described and that all particulars are true and correct.",
      margin + 4,
      termsY - 20,
    );
    termsY += 4;

    // ============ SIGNATURE SECTION ============
    const signatureBoxHeight = 20;
    // place signature below terms, totals table and company block
    const signatureBoxY = Math.max(termsY || 0, yPos || 0, compY || 0) - 17;
    const signatureBoxWidth = pageWidth - 2 * margin;
    const signatureLeftWidth = 90;
    const signatureDividerX = margin + signatureLeftWidth;

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, signatureBoxY, signatureBoxWidth, signatureBoxHeight);
    doc.setLineWidth(0.2);
    doc.line(
      signatureDividerX,
      signatureBoxY,
      signatureDividerX,
      signatureBoxY + signatureBoxHeight,
    );

    const leftSectionX = margin + 4;
    const leftSectionTextY = signatureBoxY + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Customer's Seal and Signature", leftSectionX, leftSectionTextY);
    doc.setFont("helvetica", "normal");

    const rightSectionX = signatureDividerX + 6;
    const rightSectionY = signatureBoxY + 4;
    const signatureCol1X = rightSectionX;
    const signatureCol2X = rightSectionX + 40;
    const signatureCol3X = rightSectionX + 75;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`for ${invoice.company || ""}`, rightSectionX, rightSectionY);

    doc.text("Prepared by", signatureCol1X, rightSectionY + 12);
    doc.text("Verified by", signatureCol2X, rightSectionY + 12);
    doc.text("Authorised Signatory", signatureCol3X, rightSectionY + 12);

    yPos = signatureBoxY + signatureBoxHeight + 6;
  }

  // =================== E-WAY BILL PAGE ===================
  // Add e-Way Bill page if needed
  if ((includeEwayBill && printType === "ORIGINAL") || ewayBillOnly) {
    // If only e-way bill is requested, delegate to the dedicated generator
    if (ewayBillOnly) {
      return await generateEwayBillOnlyPDF({
        seller,
        buyer,
        invoice,
        items,
        ewayBill,
      });
    }

    // Otherwise append an e-way bill page to the existing document
    doc.addPage();
    let page2Y = margin;

    // ========== PAGE HEADER ==========
    const page2LeftX = margin;
    let page2LeftY = page2Y + 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      "e-Way Bill",
      page2LeftX + (pageWidth - 2 * margin) / 2,
      page2LeftY,
      { align: "center" },
    );
    page2LeftY += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Doc No.: ${invoice.docNo || ""}`, page2LeftX, page2LeftY);
    page2LeftY += 5;
    doc.text(
      `Date: ${invoice.docDate ? formatDate(invoice.docDate) : ""}`,
      page2LeftX,
      page2LeftY,
    );
    page2LeftY += 7;

    doc.setFontSize(8);
    doc.text(`IRN: ${invoice.irn || ""}`, page2LeftX, page2LeftY);
    page2LeftY += 5;
    doc.text(`Ack No.: ${invoice.ackNo || ""}`, page2LeftX, page2LeftY);
    page2LeftY += 5;
    doc.text(
      `Ack Date: ${invoice.ackDate ? formatDate(invoice.ackDate) : ""}`,
      page2LeftX,
      page2LeftY,
    );

    // QR Code on Page
    const page2QrSize = 40;
    const page2QrX = pageWidth - margin - page2QrSize;
    const page2QrY = page2Y + 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("e-Way Bill", pageWidth - margin - page2QrSize / 2, page2Y + 6, {
      align: "center",
    });

    try {
      const ewbNo = (
        invoice.ewayBillNo ||
        ewayBill?.ewayBillNo ||
        ""
      ).substring(0, 15);
      const gstin = (seller?.gstin || invoice?.gstin || "").substring(0, 15);
      const docDate = invoice.docDate ? formatDate(invoice.docDate) : "";

      const qrText = `${ewbNo}|${gstin}|${docDate}`;

      if (qrText && qrText !== "||") {
        const qrDataURL = await generateQRCodeDataURL(qrText);
        if (qrDataURL) {
          doc.addImage(
            qrDataURL,
            "PNG",
            page2QrX,
            page2QrY,
            page2QrSize,
            page2QrSize,
          );
        }
      }
    } catch (err) {
      console.error("QR Code error:", err);
    }

    page2Y += 52;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y, pageWidth - margin, page2Y);

    // ========== 1. E-WAY BILL DETAILS ==========
    page2Y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("1. e-Way Bill Details", margin, page2Y);
    page2Y += 6;

    let ewayRowY = page2Y;
    const col1 = margin;
    const col2 = margin + 65;
    const col3 = margin + 130;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(`e-Way Bill No.: ${invoice.ewayBillNo || ""}`, col1, ewayRowY);
    doc.text(`Mode: ${ewayBill?.mode || "1 - Road"}`, col2, ewayRowY);
    doc.text(
      // `Generated Date: ${invoice?.generatedDate ? formatDateTime(ewayBill.generatedDate) : ""}`,
      `Generated Date: ${invoice.generatedDate || ""}`,
      col3,
      ewayRowY,
    );
    ewayRowY += 5;

    doc.text(`Generated By: ${invoice.gstin || ""}`, col1, ewayRowY);
    doc.text(
      `Approx Distance: ${invoice.approxDistance || ""}`,
      col2,
      ewayRowY,
    );
    doc.text(
      // `Valid Upto: ${invoice?.validUpto ? formatDate(ewayBill.validUpto) : ""}`,
      `Valid Upto: ${invoice.validDate || ""}`,
      col3,
      ewayRowY,
    );
    ewayRowY += 5;

    doc.text(
      `Supply Type: ${ewayBill?.supplyType || "Outward-Supply"}`,
      col1,
      ewayRowY,
    );
    doc.text(
      `Transaction Type: ${invoice?.transactionType || "Bill From - Dispatch From"}`,
      col2,
      ewayRowY,
    );

    page2Y = ewayRowY + 8;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

    // ========== 2. ADDRESS DETAILS ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("2. Address Details", margin, page2Y);
    page2Y += 6;

    const leftColX = margin + 5;
    const rightStartX = pageWidth / 2 + 5;
    let addrLeftY = page2Y;
    let addrRightY = page2Y;

    // Left Column - From
    doc.setFont("helvetica", "bold");
    doc.text("From", leftColX, addrLeftY);
    addrLeftY += 5;
    doc.setFont("helvetica", "normal");

    const fromLines = wrapTextForCell(seller.lglNm || "", 50);
    fromLines.forEach((line) => {
      doc.text(line, leftColX, addrLeftY);
      addrLeftY += 4;
    });
    doc.text(`GSTIN : ${seller.gstin || ""}`, leftColX, addrLeftY);
    addrLeftY += 4;
    doc.text(`${seller.loc || ""}`, leftColX, addrLeftY);
    addrLeftY += 8;

    // Left Column - Dispatch From
    doc.setFont("helvetica", "bold");
    doc.text("Dispatch From", leftColX, addrLeftY);
    addrLeftY += 5;
    doc.setFont("helvetica", "normal");

    const dispatchLines = wrapTextForCell(
      seller.dispatchAddr || seller.addr1 || "",
      55,
    );
    dispatchLines.forEach((line) => {
      doc.text(line, leftColX, addrLeftY);
      addrLeftY += 4;
    });
    doc.text(
      `${seller.pin || ""} ${seller.stateName || ""}`,
      leftColX,
      addrLeftY,
    );

    // Right Column - To
    doc.setFont("helvetica", "bold");
    doc.text("To", rightStartX, addrRightY);
    addrRightY += 5;
    doc.setFont("helvetica", "normal");

    const toLines = wrapTextForCell(buyer.lglNm || "", 50);
    toLines.forEach((line) => {
      doc.text(line, rightStartX, addrRightY);
      addrRightY += 4;
    });
    doc.text(`GSTIN : ${buyer.gstin || ""}`, rightStartX, addrRightY);
    addrRightY += 4;
    doc.text(`${buyer.loc || ""}`, rightStartX, addrRightY);
    addrRightY += 8;

    // Right Column - Ship To
    doc.setFont("helvetica", "bold");
    doc.text("Ship To", rightStartX, addrRightY);
    addrRightY += 5;
    doc.setFont("helvetica", "normal");

    const shipLines = wrapTextForCell(buyer.shipAddr || buyer.addr1 || "", 45);
    shipLines.forEach((line) => {
      doc.text(line, rightStartX, addrRightY);
      addrRightY += 4;
    });
    doc.text(
      `${buyer.stateName || ""} ${buyer.pin || ""}`,
      rightStartX,
      addrRightY,
    );

    page2Y = Math.max(addrLeftY, addrRightY) + 8;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

    // ========== 3. GOODS DETAILS ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("3. Goods Details", margin, page2Y);
    page2Y += 6;

    const goodsColumns = [
      { header: "Product Name & Desc Code", dataKey: "product", width: 60 },
      { header: "Quantity", dataKey: "qty", width: 25 },
      { header: "Taxable Amt", dataKey: "taxableAmt", width: 30 },
      { header: "Tax Rate (C+S)", dataKey: "taxRate", width: 30 },
    ];

    const goodsBody = items.map((item) => ({
      product: `${item.item_HsnCd || ""} ${item.item_PrdDesc || ""}`,
      qty: `${item.item_Qty || "0"} ${item.item_Unit || "PCS"}`,
      taxableAmt: formatAmount(item.item_AssAmt),
      taxRate: `${parseFloat(item.item_GstRt || 0) / 2}+${parseFloat(item.item_GstRt || 0) / 2}`,
    }));

    autoTable(doc, {
      startY: page2Y,
      columns: goodsColumns,
      body: goodsBody,
      margin: { left: margin + 2, right: margin + 2 },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: "middle",
        fontStyle: "normal",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [230, 232, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontStyle: "normal",
        lineWidth: 0.1,
      },
      columnStyles: {
        product: { halign: "left" },
        qty: { halign: "right" },
        taxableAmt: { halign: "right" },
        taxRate: { halign: "center" },
      },
      didDrawPage: (data) => {
        page2Y = data.cursor.y;
      },
    });

    if (!doc.previousAutoTable) {
      page2Y += 30;
    } else {
      page2Y = doc.previousAutoTable.finalY + 5;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y, pageWidth - margin, page2Y);

    // ========== TOTALS SECTION ==========
    page2Y += 4;
    const totalTaxableAmt = goodsBody.reduce(
      (sum, item) => sum + parseFloat(item.taxableAmt.replace(/,/g, "") || 0),
      0,
    );
    const totalCgst = parseFloat(totals.cgstVal) || 0;
    const totalSgst = parseFloat(totals.sgstVal) || 0;
    const netTotalValue = parseFloat(totals.totalInvVal2) || 0;
    // const totalCgstAmt = totalTaxableAmt; //* 0.025
    // const totalSgstAmt = totalTaxableAmt ;//* 0.025
    // const totalInvAmt = totalTaxableAmt + totalCgstAmt + totalSgstAmt;
    const roundOff =
      parseFloat(
        totals?.roundOff ||
          totals?.roundoff ||
          totals?.item_RoundOff ||
          invoice?.ROUNDOFF ||
          invoice?.roundOff ||
          0,
      ) ||
      items.reduce(
        (s, it) => s + (parseFloat(it.item_RoundOff || it.ROUNDOFF || 0) || 0),
        0,
      );
    const col1X = margin + 5;
    const col2X = margin + 70;
    const col3X = margin + 130;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Tot.Taxable Amt    : ${formatAmount(totalTaxableAmt)}`,
      col1X,
      page2Y,
    );

    doc.text(`Other Amt    : ${formatAmount(roundOff)}`, col2X, page2Y); //(-)0.42
    page2Y += 5;

    doc.text(`CGST Amt    : ${formatAmount(totalCgst)}`, col1X, page2Y); //totalCgstAmt
    doc.text(`SGST Amt    : ${formatAmount(totalSgst)}`, col2X, page2Y); //totalSgstAmt
    page2Y += 5;

    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Inv Amt    : ${formatAmount(netTotalValue)}`, //totalInvAmt//
      col3X,
      page2Y - 5,
    );
    page2Y += 5;
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

    // ========== 4. TRANSPORTATION DETAILS ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("4. Transportation Details", margin, page2Y);
    page2Y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Transporter ID    : ${invoice?.transporterId || ""}`,
      col1X,
      page2Y,
    );
    page2Y += 5;
    doc.text(`Name    : ${invoice?.driverName || ""}`, col1X, page2Y);
    page2Y += 5;
    doc.text(`Doc No.    : ${invoice?.docNo || ""}`, col3X, page2Y - 10);
    page2Y += 5;
    doc.text(
      `Date    : ${invoice?.docDate ? formatDate(invoice.docDate) : ""}`,
      col3X,
      page2Y - 10,
    );

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, page2Y - 6, pageWidth - margin, page2Y - 6);

    // ========== 5. VEHICLE DETAILS ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("5. Vehicle Details", margin, page2Y);
    page2Y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(`Vehicle No.    : ${invoice?.vehicleDesc || ""}`, col1X, page2Y);
    doc.text(`From    : ${invoice?.fromLoc || ""}`, col2X, page2Y);
    page2Y += 5;
    doc.text(`CEWB No.: ${invoice?.cewbNo || ""}`, col3X, page2Y - 5);
  }

  // ========== SAVE PDF ==========
  let fileName;
  if (ewayBillOnly) {
    fileName = `E-Way_Bill_${invoice.docNo || invoice.deliveryNo || "invoice"}.pdf`;
  } else {
    fileName = `GST_Invoice_${invoice.docNo || invoice.deliveryNo || "invoice"}.pdf`;
  }
  doc.save(fileName);

  return fileName;
};
