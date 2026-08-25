import { useState, useEffect } from "react";
import {
  Table,
  Pagination,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import { FaSearch, FaFileExport, FaTrash } from "react-icons/fa";

const DataGrid = () => {
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
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredData, setFilteredData] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  // Handle search and pagination
  useEffect(() => {
    // Filter data based on search term
    const filtered = data.filter((item) => {
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

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, data]);

  // Handle pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const current = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const total = Math.ceil(filteredData.length / itemsPerPage);

    setCurrentItems(current);
    setTotalPages(total);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setData((prevData) => prevData.filter((item) => item.id !== id));
    }
  };
  return (
    <div>
      {/* ========= Data Grid Part ========= */}

      <div className="mt-5">
        {/* Header */}
        <Row className="mb-3 d-flex flex-column flex-md-row">
          <Col xs={12} md={7}></Col>
          <Col xs={12} md={2} className="text-end">
            <Button variant="outline-secondary" className="mb-2">
              <FaFileExport className="me-1" />
              Export
            </Button>
          </Col>
          <Col xs={12} md={3} className="text-end">
            <div className="d-flex flex-column flex-md-row">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <div className="">
          <Table
            responsive
            striped
            bordered
            hover
            className="overflow-x-md-scroll-auto"
          >
            <thead style={{ backgroundColor: "#e7e7ff" }}>
              <tr>
                <th className="fw-bold">Delete</th>
                <th className="fw-bold">OR Date</th>
                <th className="fw-bold">Line</th>
                <th className="fw-bold">Code</th>
                <th className="fw-bold">Name</th>
                <th className="fw-bold">Price</th>
                <th className="fw-bold">Factor</th>
                <th className="fw-bold">Qty</th>
                <th className="fw-bold">Total</th>
                <th className="fw-bold">Item_Status</th>
                <th className="fw-bold">Note</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                  <td>{item.or_date}</td>
                  <td>{item.line}</td>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.factor}</td>
                  <td>{item.qty}</td>
                  <td>${item.total.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge bg-${getStatusBadgeColor(
                        item.item_status
                      )}`}
                    >
                      {item.item_status}
                    </span>
                  </td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Pagination and Info */}
        <Row className="mt-3 align-items-center">
          <Col xs={12} md={4} className="mb-2 mb-md-0">
            <div className="d-flex align-items-center">
              <span className="me-2">Show</span>
              <Form.Select
                style={{ width: "80px" }}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </Form.Select>
              <span className="ms-2">entries</span>
            </div>
          </Col>

          <Col
            xs={12}
            md={4}
            className="d-flex justify-content-center mb-2 mb-md-0"
          >
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
          </Col>
        </Row>
      </div>
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

export default DataGrid;
