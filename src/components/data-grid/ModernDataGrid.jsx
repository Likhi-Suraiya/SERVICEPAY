import { useState, useEffect, useRef } from "react";
import {
  Table,
  Pagination,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Dropdown,
  Badge,
  Modal
} from "react-bootstrap";
import { 
  FaSearch, 
  FaFileExport, 
  FaTrash, 
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes
} from "react-icons/fa";

const ModernDataGrid = () => {
  // Sample data
  const [data, setData] = useState([
    {
      id: 1,
      delete: false,
      or_date: "2023-05-15",
      line: "A-100",
      code: "PRD-001",
      name: "Stainless Steel Bolt",
      price: 4.99,
      factor: 1.0,
      qty: 50,
      total: 249.5,
      item_status: "In Stock",
      note: "Standard delivery",
    },
    {
      id: 2,
      delete: false,
      or_date: "2023-05-16",
      line: "B-205",
      code: "PRD-042",
      name: "Aluminum Bracket",
      price: 12.75,
      factor: 0.95,
      qty: 25,
      total: 302.81,
      item_status: "Backordered",
      note: "Expected 06/01",
    },
    {
      id: 3,
      delete: true,
      or_date: "2023-05-17",
      line: "C-312",
      code: "PRD-087",
      name: "Rubber Gasket",
      price: 2.25,
      factor: 1.1,
      qty: 100,
      total: 247.5,
      item_status: "Discontinued",
      note: "Replacement available",
    },
    {
      id: 4,
      delete: false,
      or_date: "2023-05-18",
      line: "D-418",
      code: "PRD-104",
      name: "Copper Wire Spool",
      price: 32.4,
      factor: 1.0,
      qty: 10,
      total: 324.0,
      item_status: "In Stock",
      note: "Priority shipping",
    },
    {
      id: 5,
      delete: false,
      or_date: "2023-05-19",
      line: "E-527",
      code: "PRD-156",
      name: "Plastic Housing",
      price: 8.9,
      factor: 0.9,
      qty: 40,
      total: 320.4,
      item_status: "Low Stock",
      note: "Final units",
    },
    {
      id: 6,
      delete: false,
      or_date: "2023-05-20",
      line: "F-630",
      code: "PRD-201",
      name: "Titanium Screws",
      price: 6.75,
      factor: 1.0,
      qty: 75,
      total: 506.25,
      item_status: "In Stock",
      note: "Bulk order discount",
    },
    {
      id: 7,
      delete: false,
      or_date: "2023-05-21",
      line: "G-745",
      code: "PRD-225",
      name: "Carbon Fiber Plate",
      price: 45.2,
      factor: 0.85,
      qty: 8,
      total: 307.36,
      item_status: "Backordered",
      note: "Special order",
    },
    {
      id: 8,
      delete: false,
      or_date: "2023-05-22",
      line: "H-812",
      code: "PRD-300",
      name: "Nylon Washers",
      price: 0.99,
      factor: 1.2,
      qty: 200,
      total: 237.6,
      item_status: "In Stock",
      note: "High demand item",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filteredData, setFilteredData] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const statusOptions = ["all", "In Stock", "Backordered", "Discontinued", "Low Stock"];
  
  // Handle search and pagination
  useEffect(() => {
    // Filter data based on search term and status filter
    const filtered = data.filter((item) => {
      // Apply status filter
      if (statusFilter !== "all" && item.item_status !== statusFilter) {
        return false;
      }
      
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();
      const fields = [
        item.or_date,
        item.line,
        item.code,
        item.name,
        item.price.toString(),
        item.factor.toString(),
        item.qty.toString(),
        item.total.toString(),
        item.item_status,
        item.note,
      ];

      return fields.some(
        (field) => field && field.toString().toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    let sorted = [...filtered];
    if (sortField) {
      sorted.sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, data, statusFilter, sortField, sortDirection]);

  // Handle pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const current = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const total = Math.ceil(filteredData.length / itemsPerPage);

    setCurrentItems(current);
    setTotalPages(total);
    
    // Reset select all when data changes
    setSelectAll(false);
    setSelectedRows([]);
  }, [filteredData, currentPage, itemsPerPage]);

  // Handle row selection
  useEffect(() => {
    if (selectAll && currentItems.length > 0) {
      setSelectedRows(currentItems.map(item => item.id));
    } else if (!selectAll) {
      setSelectedRows([]);
    }
  }, [selectAll, currentItems]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setData((prevData) => prevData.filter((item) => item.id !== id));
    }
  };
  
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} item(s)?`)) {
      setData((prevData) => prevData.filter((item) => !selectedRows.includes(item.id)));
      setSelectedRows([]);
      setSelectAll(false);
    }
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />;
  };
  
  const handleExport = () => {
    setShowExportModal(true);
  };
  
  const executeExport = () => {
    alert(`Exporting ${filteredData.length} records as ${exportFormat.toUpperCase()}`);
    setShowExportModal(false);
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const toggleRowSelection = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="data-grid-container">
      <style jsx>{`
        .data-grid-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(145deg, #f8f9fa, #e9ecef);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          padding: 25px;
          transition: all 0.3s ease;
        }
        
        .card-header {
          background: linear-gradient(120deg, #4e54c8, #8f94fb);
          color: white;
          border-radius: 10px 10px 0 0 !important;
          padding: 20px;
          border: none;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .table-container {
          border-radius: 0 0 10px 10px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .table-hover tbody tr {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .table-hover tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          background-color: #f8f9fa;
          cursor: pointer;
        }
        
        .table thead th {
          background: linear-gradient(180deg, #6c757d, #495057);
          color: white;
          border: none;
          padding: 16px 12px;
          font-weight: 600;
          vertical-align: middle;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .table thead th:hover {
          background: linear-gradient(180deg, #5a6268, #343a40);
        }
        
        .table tbody td {
          padding: 14px 12px;
          vertical-align: middle;
          border-top: 1px solid #e9ecef;
        }
        
        .table-striped tbody tr:nth-of-type(odd) {
          background-color: rgba(248, 249, 250, 0.6);
        }
        
        .action-btn {
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .search-box {
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #ced4da;
        }
        
        .search-box:focus-within {
          box-shadow: 0 0 0 0.25rem rgba(78, 84, 200, 0.25);
          border-color: #4e54c8;
        }
        
        .filter-panel {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .status-badge {
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .pagination-container {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          margin-top: 20px;
        }
        
        .page-item.active .page-link {
          background: linear-gradient(120deg, #4e54c8, #8f94fb);
          border-color: #4e54c8;
          box-shadow: 0 2px 5px rgba(78, 84, 200, 0.3);
        }
        
        .page-link {
          border-radius: 8px !important;
          margin: 0 3px;
          border: none;
          color: #495057;
          font-weight: 600;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        
        .page-link:hover {
          background-color: #e9ecef;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .export-modal {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }
        
        .export-modal .modal-header {
          background: linear-gradient(120deg, #4e54c8, #8f94fb);
          color: white;
          border-bottom: none;
        }
        
        .export-option {
          padding: 15px;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          background: white;
        }
        
        .export-option:hover, .export-option.active {
          border-color: #4e54c8;
          background-color: rgba(78, 84, 200, 0.05);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        
        .export-option.active {
          border-color: #4e54c8;
          background-color: rgba(78, 84, 200, 0.1);
        }
        
        .export-option h5 {
          color: #4e54c8;
          font-weight: 600;
        }
        
        .export-btn {
          background: linear-gradient(120deg, #4e54c8, #8f94fb);
          border: none;
          font-weight: 600;
          padding: 10px 25px;
          border-radius: 8px;
          transition: all 0.3s;
          box-shadow: 0 4px 10px rgba(78, 84, 200, 0.3);
        }
        
        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(78, 84, 200, 0.4);
        }
        
        .filter-btn {
          background: white;
          color: #495057;
          border: 1px solid #ced4da;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 15px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .filter-btn:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .filter-btn.active {
          background: #4e54c8;
          color: white;
          border-color: #4e54c8;
        }
        
        .filter-tag {
          display: inline-flex;
          align-items: center;
          background: #e0e7ff;
          color: #4e54c8;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.85rem;
          margin-right: 8px;
          font-weight: 600;
        }
        
        .filter-tag button {
          background: none;
          border: none;
          color: #4e54c8;
          margin-left: 5px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .filter-tag button:hover {
          opacity: 1;
        }
        
        .stats-card {
          background: white;
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          text-align: center;
          transition: all 0.3s;
        }
        
        .stats-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stats-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #4e54c8;
          margin: 10px 0;
        }
        
        .stats-label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .bulk-action-bar {
          background: rgba(78, 84, 200, 0.1);
          border-radius: 8px;
          padding: 10px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* Header Section */}
      <div className="card-header mb-4">
        <Row className="align-items-center">
          <Col md={6}>
            <h2 className="mb-0">Product Inventory</h2>
            <p className="mb-0 opacity-75">Manage your product inventory efficiently</p>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <Button 
              variant="light" 
              className="action-btn me-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-1" /> 
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button 
              variant="light" 
              className="action-btn me-2"
              onClick={handleExport}
            >
              <FaFileExport className="me-1" /> 
              Export
            </Button>
          </Col>
        </Row>
      </div>

      {/* Stats Overview */}
      <Row className="mb-4">
        <Col md={3} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="stats-value">{data.length}</div>
            <div className="stats-label">Total Products</div>
          </div>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="stats-value">{data.filter(item => item.item_status === "In Stock").length}</div>
            <div className="stats-label">In Stock</div>
          </div>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="stats-value">{data.filter(item => item.item_status === "Backordered").length}</div>
            <div className="stats-label">Backordered</div>
          </div>
        </Col>
        <Col md={3}>
          <div className="stats-card">
            <div className="stats-value">${data.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</div>
            <div className="stats-label">Total Value</div>
          </div>
        </Col>
      </Row>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filter-panel">
          <Row className="align-items-center">
            <Col md={6}>
              <h5 className="mb-3">Filters</h5>
              <div className="d-flex flex-wrap">
                <div className="filter-tag">
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                  <button onClick={() => setStatusFilter("all")}>
                    <FaTimes />
                  </button>
                </div>
                {searchTerm && (
                  <div className="filter-tag">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </Col>
            <Col md={6} className="mt-3 mt-md-0">
              <InputGroup className="search-box">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0"
                />
              </InputGroup>
            </Col>
          </Row>
          
          <Row className="mt-3">
            <Col md={12}>
              <h6 className="mb-2">Status Filter</h6>
              <div className="d-flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button 
                    key={option}
                    className={`filter-btn ${statusFilter === option ? "active" : ""}`}
                    onClick={() => setStatusFilter(option)}
                  >
                    {option === "all" ? "All Statuses" : option}
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bulk-action-bar">
          <div>
            <strong>{selectedRows.length}</strong> item(s) selected
          </div>
          <div>
            <Button 
              variant="danger" 
              className="action-btn"
              onClick={handleBulkDelete}
            >
              <FaTrash className="me-1" /> 
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <Table responsive hover striped className="mb-0">
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                />
              </th>
              <th onClick={() => handleSort("or_date")}>
                <div className="d-flex align-items-center justify-content-between">
                  OR Date
                  {getSortIcon("or_date")}
                </div>
              </th>
              <th onClick={() => handleSort("line")}>
                <div className="d-flex align-items-center justify-content-between">
                  Line
                  {getSortIcon("line")}
                </div>
              </th>
              <th onClick={() => handleSort("code")}>
                <div className="d-flex align-items-center justify-content-between">
                  Code
                  {getSortIcon("code")}
                </div>
              </th>
              <th onClick={() => handleSort("name")}>
                <div className="d-flex align-items-center justify-content-between">
                  Name
                  {getSortIcon("name")}
                </div>
              </th>
              <th className="text-end" onClick={() => handleSort("price")}>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  Price
                  {getSortIcon("price")}
                </div>
              </th>
              <th className="text-end" onClick={() => handleSort("factor")}>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  Factor
                  {getSortIcon("factor")}
                </div>
              </th>
              <th className="text-end" onClick={() => handleSort("qty")}>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  Qty
                  {getSortIcon("qty")}
                </div>
              </th>
              <th className="text-end" onClick={() => handleSort("total")}>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  Total
                  {getSortIcon("total")}
                </div>
              </th>
              <th>Item Status</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedRows.includes(item.id)}
                    onChange={() => toggleRowSelection(item.id)}
                  />
                </td>
                <td>{item.or_date}</td>
                <td><span className="badge bg-secondary">{item.line}</span></td>
                <td><code>{item.code}</code></td>
                <td>{item.name}</td>
                <td className="text-end">{formatCurrency(item.price)}</td>
                <td className="text-end">{item.factor}</td>
                <td className="text-end">{item.qty}</td>
                <td className="text-end fw-bold">{formatCurrency(item.total)}</td>
                <td>
                  <span className={`status-badge bg-${getStatusBadgeColor(item.item_status)}`}>
                    {item.item_status}
                  </span>
                </td>
                <td>{item.note}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="d-inline-flex align-items-center"
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Pagination and Info */}
      <div className="pagination-container">
        <Row className="align-items-center">
          <Col xs={12} md={4} className="mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              <span className="me-2">Show</span>
              <Form.Select
                style={{ width: "80px" }}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </Form.Select>
              <span className="ms-2">entries per page</span>
            </div>
          </Col>

          <Col xs={12} md={4} className="d-flex justify-content-center mb-3 mb-md-0">
            <Pagination className="mb-0">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              />

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}

              <Pagination.Next
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>

          <Col xs={12} md={4} className="text-center text-md-end">
            Showing{" "}
            {Math.min(
              (currentPage - 1) * itemsPerPage + 1,
              filteredData.length
            )}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} entries
            {statusFilter !== "all" && ` (filtered from ${data.length} total entries)`}
          </Col>
        </Row>
      </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Export Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Select export format and options</p>
          
          <Row className="mt-4">
            <Col md={6} className="mb-3">
              <div 
                className={`export-option ${exportFormat === "csv" ? "active" : ""}`}
                onClick={() => setExportFormat("csv")}
              >
                <h5>CSV</h5>
                <p className="text-muted mb-0">Comma separated values</p>
              </div>
            </Col>
            <Col md={6} className="mb-3">
              <div 
                className={`export-option ${exportFormat === "excel" ? "active" : ""}`}
                onClick={() => setExportFormat("excel")}
              >
                <h5>Excel</h5>
                <p className="text-muted mb-0">Microsoft Excel format</p>
              </div>
            </Col>
            <Col md={6}>
              <div 
                className={`export-option ${exportFormat === "pdf" ? "active" : ""}`}
                onClick={() => setExportFormat("pdf")}
              >
                <h5>PDF</h5>
                <p className="text-muted mb-0">Portable Document Format</p>
              </div>
            </Col>
            <Col md={6}>
              <div 
                className={`export-option ${exportFormat === "json" ? "active" : ""}`}
                onClick={() => setExportFormat("json")}
              >
                <h5>JSON</h5>
                <p className="text-muted mb-0">JavaScript Object Notation</p>
              </div>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="secondary" 
              className="me-2" 
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="export-btn"
              onClick={executeExport}
            >
              Export Data
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

function getStatusBadgeColor(status) {
  switch (status) {
    case "In Stock":
      return "success";
    case "Backordered":
      return "warning";
    case "Discontinued":
      return "danger";
    case "Low Stock":
      return "info";
    default:
      return "secondary";
  }
}

export default ModernDataGrid;