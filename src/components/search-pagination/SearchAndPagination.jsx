import { useState, useEffect } from "react";
import { Pagination, Form, Row, Col } from "react-bootstrap";

export const SearchAndPagination = (data, defaultItemsPerPage = 20) => {
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

  return (
    <>
      {/* searchTerm, setSearchTerm  */}
      {/* Pagination and Info */}
      <Row className="mt-3 align-items-center">
        <Col xs={12} md={4} className="mb-2 mb-md-0">
          <div className="d-flex align-items-center">
            <span className="me-2">Show</span>
            <Form.Select
              size="sm"
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
          <Pagination size="sm" className="mb-0">
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
                  size="sm"
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}

            <Pagination.Next
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
          {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}{" "}
          to {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
          {filteredData.length} entries
        </Col>
      </Row>
    </>
  );
};
