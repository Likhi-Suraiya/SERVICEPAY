import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Pagination,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Badge,
  Modal,
} from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import {
  useSearchAndPagination,
  exportToExcelMultiSheet,
} from "../../../utils/commonMethods";
import { AddOwnerModal } from "./AddOwnerModal";
import {
  getOwners,
  getAllAssets,
  insertOwner,
  updateOwner,
  deleteOwner,
} from "../../../api/ownerapi";
import { uploadOwnerDoc } from "../../../api/ownerdocapi";
import { getActionBy } from "../../../utils/commonMethods";

export const OwnersList = () => {
  const { user } = useAuth();
  const [owners, setOwners] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedInfo, setSavedInfo] = useState(null);
  const [viewMode, setViewMode] = useState(false); // Track if we're in view mode

 const actionBy = getActionBy(user) || user?.userName || user?.username || "WEB";

  const loadOwners = async () => {
    setIsLoading(true);
    try {
      const [ownerRows, assetRows] = await Promise.all([
        getOwners(),
        getAllAssets().catch(() => []), // assets are optional; don't block the list
      ]);
      setOwners(ownerRows);
      setAllAssets(assetRows);
    } catch (err) {
      toast.error(err.message || "Failed to load owners");
    } finally {
      setIsLoading(false);
    }
  };

  // customerId -> [assets]
  const assetsByCustomer = useMemo(() => {
    const map = {};
    for (const a of allAssets) {
      const key = (a.customerId || "").trim();
      if (!key) continue;
      (map[key] ??= []).push(a);
    }
    return map;
  }, [allAssets]);

  useEffect(() => {
    loadOwners();
  }, []);

  // Search and Pagination
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredData,
    currentItems,
    totalPages,
  } = useSearchAndPagination(owners, 10);

  // Export to Excel (Owners sheet + Assets sheet)
  const handleExport = () => {
    // Every BLIL_OWNER column, in table order. Header shows the label
    // AND the DB column name so the sheet doubles as the bulk-insert map.
    const ownerFields = {
      customerId: "Customer ID ",
      customerType: "Customer Type ",
      companyName: "Company/House Name ",
      customerName: "Customer Name ",
      contactNumber: "Contact Number ",
      contactNumber2: "Contact Number 2 ",
      area: "Zone ",
      districtCode: "District Code ",
      district: "District ",
      thanaCode: "Thana Code ",
      thana: "Thana ",
      fullAddress: "Full Address ",
      agreementStart: "Agreement Start ",
      amendmentDate: "Amendment Date ",
      freeServiceStartDate: "Free Service Start ",
      freeServiceEndDate: "Free Service End ",
      serviceAmount: "Monthly Service Amount ",
      paidServiceStartDate: "Paid Service Start ",
      paidServiceEndDate: "Paid Service End ",
      incrementAfterMonths: "Increment After Months ",
      incrementAmount: "Increment Amount ",
      totalIncrement: "Total Increment ",
      advanceAmount: "Advance Amount ",
      adjustmentAmount: "Monthly Adjust Amount ",
      paymentMethod: "Payment Method ",
      paymentType: "Payment Type ",
      accountNumber: "Account Number ",
      bankName: "Bank Name ",
      branchName: "Branch Name ",
      routingNumber: "Routing Number ",
      receivedBy: "Received By Staff ID ",
      status: "Status ",
      assetSummary: "Assets (summary)",
    };

    const assetFields = {
      customerId: "Customer ID ",
      companyName: "Company/House Name",
      customerName: "Customer Name",
      assetType: "Asset Type ",
      model: "Model ",
      capacity: "Capacity ",
      liftSize: "Lift Size ",
      quantity: "Quantity ",
      handOverDate: "Handover Date ",
      maintenanceSchedule: "Maintenance Schedule ",
      status: "Status ",
    };

    // Owners sheet: append a readable asset summary per owner
    const ownersData = owners.map((o) => ({
      ...o,
      assetSummary: getAssetDisplay(o),
    }));

    // Assets sheet: one row per asset, enriched with owner name/company
    const ownerById = Object.fromEntries(
      owners.map((o) => [(o.customerId || "").trim(), o])
    );
    const assetsData = allAssets.map((a) => {
      const o = ownerById[(a.customerId || "").trim()] || {};
      return {
        ...a,
        companyName: o.companyName,
        customerName: o.customerName,
      };
    });

    exportToExcelMultiSheet({
      sheets: [
        { data: ownersData, sheetName: "Owners", fieldsMapping: ownerFields },
        { data: assetsData, sheetName: "Assets", fieldsMapping: assetFields },
      ],
      filename: "owners_list",
      onSuccess: (message) => toast.success(message),
      onError: (message) => toast.error(message),
    });
  };

  // Delete Owner
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this owner?")) return;
    try {
      await deleteOwner(id, actionBy);
      toast.success("Owner deleted successfully");
      loadOwners();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  // View Owner (Read-only mode)
  const handleView = (owner) => {
    setSelectedOwner(owner);
    setViewMode(true);
    setShowAddModal(true);
  };

  // Edit Owner (Edit mode)
  const handleEdit = (owner) => {
    setSelectedOwner(owner);
    setViewMode(false);
    setShowAddModal(true);
  };

  // Get Status Badge
  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'success',
      'Expired': 'danger',
      'Pending': 'warning',
      'Suspended': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // Format asset display — computed from BLIL_ASSET rows loaded via /AllAssets
  const getAssetDisplay = (owner) => {
    const list = assetsByCustomer[(owner.customerId || "").trim()] || [];
    if (list.length === 0) return "-";

    // Sum quantity per asset type (e.g. { Lift: 2, Generator: 1 })
    const counts = {};
    for (const a of list) {
      const type = (a.assetType || "Other").trim();
      const qty = Number(a.quantity) > 0 ? Number(a.quantity) : 1;
      counts[type] = (counts[type] || 0) + qty;
    }

    return Object.entries(counts)
      .map(([type, qty]) => {
        const label =
          type.toLowerCase() === "generator" ? "Gen" : type;
        return `${qty} ${label}${qty > 1 ? "s" : ""}`;
      })
      .join(", ");
  };

  return (
    <>
      <ToastContainer position="top-right" />
      
      <div className="p-3">
        <div className="card shadow-sm">
          <div className="card-body">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="bx bx-user me-2"></i>
                Customer Details
              </h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setSelectedOwner(null);
                  setViewMode(false);
                  setShowAddModal(true);
                }}
                style={{ backgroundColor: "#055fae" }}
              >
                <FaPlus className="me-1" />
                Add New Owner
              </Button>
            </div>

            {/* Search and Controls */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-md-6">
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by name, company, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleExport}
                >
                  <i className="bx bx-export me-1"></i>
                  Export
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead style={{ backgroundColor: "#e7e7ff" }}>
                  <tr>
                    <th>#</th>
                    <th>Customer ID</th>
                    <th>Company/House</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Assets</th>
                    <th>Area/Zone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        <div className="spinner-border text-primary" size="sm" />
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No owners found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((owner, index) => (
                      <tr key={owner.id || owner.customerId}>
                        <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                        <td>
                          <Badge bg="primary">{owner.customerId}</Badge>
                        </td>
                        <td>{owner.companyName}</td>
                        <td>{owner.customerName}</td>
                        <td>{owner.contactNumber}</td>
                        <td>{getAssetDisplay(owner)}</td>
                        <td>{owner.area}</td>
                        <td>{getStatusBadge(owner.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => handleView(owner)}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEdit(owner)}
                              title="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(owner.id || owner.customerId)}
                              title="Delete"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            <Row className="mt-3 align-items-center gy-2">
              <Col xs={12} md={4}>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start">
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

              <Col xs={12} md={4} className="d-flex justify-content-center">
                <Pagination size="sm" className="mb-0">
                  <Pagination.First
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
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
                  <Pagination.Next
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Col>

              <Col xs={12} md={4} className="text-center text-md-end">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </Col>
            </Row>
          </div>
        </div>
      </div>

      {/* Add/Edit/View Modal */}
      <AddOwnerModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setSelectedOwner(null);
          setViewMode(false);
        }}
        owner={selectedOwner}
        viewMode={viewMode}  // Pass viewMode to the modal
        onSave={async (newOwner) => {
          const { agreementFile, ...ownerData } = newOwner;
          try {
            const isEdit = !!selectedOwner;
            if (isEdit) {
              await updateOwner(ownerData, actionBy);
            } else {
              await insertOwner(ownerData, actionBy);
            }
            if (agreementFile) {
              try {
                await uploadOwnerDoc(newOwner.customerId, agreementFile, actionBy);
              } catch (docErr) {
                toast.warn(
                  "Customer saved, but the agreement copy upload failed: " +
                    (docErr.message || "")
                );
              }
            }
            setShowAddModal(false);
            setSelectedOwner(null);
            setViewMode(false);
            setSavedInfo({ customerId: newOwner.customerId, isEdit });
            loadOwners();
          } catch (err) {
            toast.error(err.message || "Save failed");
          }
        }}
      />

      {/* Save Confirmation */}
      <Modal
        show={!!savedInfo}
        onHide={() => setSavedInfo(null)}
        centered
        backdrop="static"
      >
        <Modal.Body className="text-center py-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-success text-white"
            style={{ width: "64px", height: "64px", fontSize: "2rem" }}
          >
            &#10003;
          </div>
          <h5 className="mb-1">
            Owner {savedInfo?.isEdit ? "Updated" : "Saved"} Successfully
          </h5>
          <p className="text-muted mb-3">
            Customer ID: <strong>{savedInfo?.customerId}</strong>
          </p>
          <Button variant="success" onClick={() => setSavedInfo(null)}>
            OK
          </Button>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-right" autoClose={2500} />
    </>
  );
};