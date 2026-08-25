import { useState } from 'react';
import { 
  Table, 
  Pagination, 
  Form, 
  InputGroup, 
  Button, 
  Dropdown,
  Card,
  Container,
  Row,
  Col
} from 'react-bootstrap';
import { FaSearch, FaFilter, FaFileExport, FaBars } from 'react-icons/fa';

const TestPage = () => {
  // Sample data
  const data = [
    { id: 1, name: "Kernie O'Crevy", email: "kercrevy09@hotimes.co.uk", post: "Nuclear Power Engineer", city: "Knoxedilloa", date: "09/22/2021", salary: "$23,989.35", age: 61, experience: "1 Year", status: "Professional" },
    // Add all other rows...
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');

  // Filter data
  const filteredData = data.filter(item => {
    const matchesSearch = Object.values(item).some(
      val => val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <Container fluid className="p-3">
      {/* Header */}
      <Row className="mb-3 align-items-center">
        <Col xs={12} md={6}>
          <h4 className="mb-3 mb-md-0">Responsive Datatable</h4>
        </Col>
        <Col xs={12} md={6}>
          <div className="d-flex flex-column flex-md-row gap-2">
            {/* Search - shown on all screens */}
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            {/* Filter dropdown - hidden on mobile */}
            <Dropdown as={InputGroup} className="d-none d-md-flex">
              <InputGroup.Text>
                <FaFilter />
              </InputGroup.Text>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>All</option>
                <option>Professional</option>
                <option>Applied</option>
                <option>Contact</option>
                <option>Related</option>
              </Form.Select>
            </Dropdown>
            
            {/* Export button - hidden on mobile */}
            <Button variant="outline-secondary" className="d-none d-md-flex">
              <FaFileExport className="me-1" />
              Export
            </Button>
            
            {/* Mobile menu button */}
            <Dropdown className="d-md-none">
              <Dropdown.Toggle variant="outline-secondary">
                <FaBars />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>
                  <FaFilter className="me-2" /> Filter
                </Dropdown.Item>
                <Dropdown.Item>
                  <FaFileExport className="me-2" /> Export
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Col>
      </Row>

      {/* Table - hidden on mobile */}
      <div className="">
        <Table responsive striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Post</th>
              <th>City</th>
              <th>Date</th>
              <th>Salary</th>
              <th>Age</th>
              <th>Experience</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.post}</td>
                <td>{item.city}</td>
                <td>{item.date}</td>
                <td>{item.salary}</td>
                <td>{item.age}</td>
                <td>{item.experience}</td>
                <td>
                  <span className={`badge bg-${getStatusBadgeColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
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
              style={{ width: '80px' }}
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
        
        <Col xs={12} md={4} className="d-flex justify-content-center mb-2 mb-md-0">
          <Pagination className="mb-0">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
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
            
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        </Col>
        
        <Col xs={12} md={4} className="text-center text-md-end">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
        </Col>
      </Row>
    </Container>
  );
};

// Helper function for badge colors
function getStatusBadgeColor(status) {
  switch(status) {
    case 'Professional': return 'primary';
    case 'Applied': return 'warning';
    case 'Contact': return 'info';
    case 'Related': return 'success';
    default: return 'secondary';
  }
}

export default TestPage;