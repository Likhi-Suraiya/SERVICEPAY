import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const useSearchAndPagination = (data, defaultItemsPerPage = 50) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [filteredData, setFilteredData] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  //================= Handle search ===============

  useEffect(() => {
    const filtered = data.filter((item) => {
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();

      return Object.values(item).some(
        (value) => value && value.toString().toLowerCase().includes(searchLower)
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, data]);

  // =================== Handle pagination ===================

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const current = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const total = Math.ceil(filteredData.length / itemsPerPage);

    setCurrentItems(current);
    setTotalPages(total);
  }, [filteredData, currentPage, itemsPerPage]);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredData,
    currentItems,
    totalPages,
  };
};

// =================== Handle Export To Excel ===================

export const exportToExcel = ({
  data,
  filename,
  sheetName = "Data",
  fieldsMapping = null,
  onSuccess = () => {},
  onError = () => {},
}) => {
  if (!data || data.length === 0) {
    onError("No data to export");
    return;
  }

  try {
    // Use custom field mapping or default to original field names
    const dataToExport = fieldsMapping
      ? data.map((item) => {
          const mappedItem = {};
          Object.keys(fieldsMapping).forEach((key) => {
            // Handle nested objects with dot notation (e.g., "user.name")
            const value = key.includes(".")
              ? key.split(".").reduce((obj, i) => obj?.[i], item)
              : item[key];

            mappedItem[fieldsMapping[key]] = value;
          });
          return mappedItem;
        })
      : data;

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(
      workbook,
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    onSuccess("Data exported successfully");
  } catch (error) {
    console.error("Export failed", error);
    onError("Failed to export data");
  }
};

// =================== Handle Export To Excel (multiple sheets) ===================
// sheets: [{ data, sheetName, fieldsMapping }]
export const exportToExcelMultiSheet = ({
  sheets,
  filename,
  onSuccess = () => {},
  onError = () => {},
}) => {
  if (!sheets || sheets.length === 0 || sheets.every((s) => !s.data?.length)) {
    onError("No data to export");
    return;
  }

  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ data, sheetName = "Data", fieldsMapping = null }) => {
      if (!data || data.length === 0) return;
      const rows = fieldsMapping
        ? data.map((item) => {
            const mapped = {};
            Object.keys(fieldsMapping).forEach((key) => {
              const value = key.includes(".")
                ? key.split(".").reduce((obj, i) => obj?.[i], item)
                : item[key];
              mapped[fieldsMapping[key]] = value;
            });
            return mapped;
          })
        : data;
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rows),
        sheetName
      );
    });

    XLSX.writeFile(
      workbook,
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    onSuccess("Data exported successfully");
  } catch (error) {
    console.error("Export failed", error);
    onError("Failed to export data");
  }
};


export const getActionBy = (user) =>
  user?.staffId || user?.empId || user?.employeeId || user?.userId || user?.userName || "USER";

// =================== Handle Export To PDF ===================

export const exportToPDF = ({
  data,
  filename,
  title = "Report",
  fieldsMapping = null,
  orientation = "landscape",
  onSuccess = () => {},
  onError = () => {},
}) => {
  if (!data || data.length === 0) {
    onError("No data to export");
    return;
  }

  try {
    // Use custom field mapping or default to original field names
    const dataToExport = fieldsMapping
      ? data.map((item) => {
          const mappedItem = {};
          Object.keys(fieldsMapping).forEach((key) => {
            const value = key.includes(".")
              ? key.split(".").reduce((obj, i) => obj?.[i], item)
              : item[key];
            mappedItem[fieldsMapping[key]] = value;
          });
          return mappedItem;
        })
      : data;

    // Create new PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: "a4",
    });

    // Add title
    const currentDate = new Date().toISOString().split("T")[0];
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(title, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${currentDate}`, 14, 22);

    // Prepare table data
    const headers = Object.keys(dataToExport[0]);
    const tableData = dataToExport.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "number") return value;
        return value.toString();
      })
    );

    // Use autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 30 },
    });

    // Save PDF
    doc.save(`${filename}_${currentDate}.pdf`);
    onSuccess("Data exported successfully as PDF");
  } catch (error) {
    console.error("PDF export failed", error);
    onError("Failed to export data as PDF");
  }
};

// =================== Number to Word Amount ===================

export const convertNumberToWords = (num) => {

    if(num === 0) return "Zero Taka Only";
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n >= 10) {
        result += teens[n - 10] + ' ';
        n = 0;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result.trim();
    };

    const numStr = num.toString();
    const [integerPart, decimalPart] = numStr.split('.');
    let number = parseInt(integerPart);
    let decimal = 0;
    if(decimalPart && decimalPart.length > 0) {
      const twoDigitDecimal = decimalPart.substring(0, 2).padEnd(2, '0');
      decimal = parseInt(twoDigitDecimal);
    }
    
    if (number === 0 && decimal > 0) {
      return convertHundreds(decimal) + ' Paisa Only';
    }
    let words = '';
    // Crore
    if (number >= 10000000) {
      words += convertHundreds(Math.floor(number / 10000000)) + ' Crore ';
      number %= 10000000;
    }
    // Lakh
    if (number >= 100000) {
      words += convertHundreds(Math.floor(number / 100000)) + ' Lakh ';
      number %= 100000;
    }
    // Thousand
    if (number >= 1000) {
      words += convertHundreds(Math.floor(number / 1000)) + ' Thousand ';
      number %= 1000;
    }
    // Hundreds
    if (number > 0) {
      words += convertHundreds(number);
    }
    words = words.trim() + ' Taka';
    // Paisa
    if (decimal > 0) {
      words += ' and ' + convertHundreds(decimal) + ' Paisa';
    }
    return words + ' Only';
  };