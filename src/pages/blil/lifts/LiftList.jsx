
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Badge,
  Card,
  Tabs,
  Tab,
  Modal,
  Spinner,
} from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaUndo, FaSave } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import {
  getAssetModelsAll,
  insertAssetModel,
  updateAssetModel,
  deleteAssetModel,
  activateAssetModel,
} from "../../../api/assetmodelapi";
import {
  getSpareItems,
  insertSpareItem,
  updateSpareItem,
  deleteSpareItem,
} from "../../../api/spareapi";
import { getActionBy } from "../../../utils/commonMethods";

const emptySpare = { itemName: "", groupName: "", unit: "", salePrice: "" };

export const LiftList = () => {
  const { user } = useAuth();
  const actionBy = getActionBy(user);

  const [activeTab, setActiveTab] = useState("Lift");

  // ---- asset models ----
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [editModel, setEditModel] = useState(null); // {modelId, assetType, modelName}

  // ---- spare parts ----
  const [spares, setSpares] = useState([]);
  const [sparesLoaded, setSparesLoaded] = useState(false);
  const [sparesLoading, setSparesLoading] = useState(false);
  const [spareSearch, setSpareSearch] = useState("");
  const [newSpare, setNewSpare] = useState(emptySpare);
  const [editSpare, setEditSpare] = useState(null);
  const [saving, setSaving] = useState(false);

  // ---- loads ----
  const loadModels = async () => {
    setModelsLoading(true);
    try {
      setModels(await getAssetModelsAll());
    } catch (err) {
      toast.error(err.message || "Failed to load models");
    } finally {
      setModelsLoading(false);
    }
  };

  const loadSpares = async () => {
    setSparesLoading(true);
    try {
      setSpares(await getSpareItems());
      setSparesLoaded(true);
    } catch (err) {
      toast.error(err.message || "Failed to load spare parts");
    } finally {
      setSparesLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = (k) => {
    setActiveTab(k);
    if (k === "Spare" && !sparesLoaded) loadSpares();
  };

  // ---- model actions ----
  const typeModels = useMemo(
    () => models.filter((m) => m.assetType === activeTab),
    [models, activeTab]
  );

  const addModel = async () => {
    const name = newModelName.trim();
    if (!name) return toast.warn("Enter the model/brand name");
    setSaving(true);
    try {
      await insertAssetModel({ assetType: activeTab, modelName: name }, actionBy);
      toast.success(`${name} added to ${activeTab} models`);
      setNewModelName("");
      loadModels();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEditModel = async () => {
    if (!editModel?.modelName?.trim()) return toast.warn("Model name is required");
    setSaving(true);
    try {
      await updateAssetModel(editModel, actionBy);
      toast.success("Model updated");
      setEditModel(null);
      loadModels();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleModel = async (m) => {
    try {
      if (m.activeYn === "Y") {
        await deleteAssetModel(m.modelId, actionBy);
        toast.success(`${m.modelName} deactivated`);
      } else {
        await activateAssetModel(m.modelId, actionBy);
        toast.success(`${m.modelName} activated`);
      }
      loadModels();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  // ---- spare actions ----
  const filteredSpares = useMemo(() => {
    const q = spareSearch.trim().toLowerCase();
    if (!q) return spares;
    return spares.filter(
      (s) =>
        (s.itemName || "").toLowerCase().includes(q) ||
        (s.groupName || "").toLowerCase().includes(q)
    );
  }, [spares, spareSearch]);

  const addSpare = async () => {
    if (!newSpare.itemName.trim()) return toast.warn("Item name is required");
    setSaving(true);
    try {
      await insertSpareItem(newSpare, actionBy);
      toast.success(`${newSpare.itemName} added to spare parts`);
      setNewSpare(emptySpare);
      loadSpares();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEditSpare = async () => {
    if (!editSpare?.itemName?.trim()) return toast.warn("Item name is required");
    setSaving(true);
    try {
      await updateSpareItem(
        {
          itemId: parseInt(editSpare.itemId),
          itemName: editSpare.itemName,
          groupName: editSpare.groupName,
          unit: editSpare.unitName ?? editSpare.unit,
          salePrice: editSpare.salePrice,
          itemStatus: editSpare.itemStatus,
        },
        actionBy
      );
      toast.success("Item updated");
      setEditSpare(null);
      loadSpares();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const deactivateSpare = async (s) => {
    try {
      await deleteSpareItem(parseInt(s.itemId), actionBy);
      toast.success(`${s.itemName} deactivated`);
      loadSpares();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const reactivateSpare = async (s) => {
    try {
      await updateSpareItem(
        {
          itemId: parseInt(s.itemId),
          itemName: s.itemName,
          groupName: s.groupName,
          unit: s.unitName,
          salePrice: s.salePrice,
          itemStatus: "A",
        },
        actionBy
      );
      toast.success(`${s.itemName} activated`);
      loadSpares();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const spareInactive = (s) =>
    ["N", "I", "INACTIVE", "D", "DELETED"].includes(
      (s.itemStatus || "").toUpperCase()
    );

  const statusBadge = (active) => (
    <Badge bg={active ? "success" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );

  // ---- model tab content (shared for Lift / Generator) ----
  const modelTab = (
    <>
      <Row className="g-2 align-items-end mb-3">
        <Col xs={8} md={4}>
          <Form.Label>
            New {activeTab} Model / Brand <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addModel();
              }
            }}
            placeholder={`e.g. ${activeTab === "Lift" ? "KONE" : "Cummins"}`}
          />
        </Col>
        <Col xs={4} md={2}>
          <Button
            className="w-100"
            style={{ backgroundColor: "#055fae" }}
            onClick={addModel}
            disabled={saving}
          >
            <FaPlus className="me-1" />
            Add
          </Button>
        </Col>
        <Col xs={12} md={6} className="text-md-end">
          <small className="text-muted">
            Active models appear in the Customer Details form's Model dropdown
          </small>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered size="sm" className="mb-0">
          <thead style={{ backgroundColor: "#e7e7ff" }}>
            <tr>
              <th style={{ width: "70px" }}>ID</th>
              <th>Model / Brand</th>
              <th style={{ width: "100px" }}>Status</th>
              <th style={{ width: "110px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {modelsLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-3">
                  <Spinner size="sm" animation="border" />
                </td>
              </tr>
            ) : typeModels.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-3">
                  No {activeTab.toLowerCase()} models yet
                </td>
              </tr>
            ) : (
              typeModels.map((m) => (
                <tr key={m.modelId} className={m.activeYn !== "Y" ? "text-muted" : ""}>
                  <td>{m.modelId}</td>
                  <td>{m.modelName}</td>
                  <td>{statusBadge(m.activeYn === "Y")}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        title="Edit"
                        onClick={() => setEditModel({ ...m, modelId: parseInt(m.modelId) })}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant={m.activeYn === "Y" ? "outline-danger" : "outline-success"}
                        size="sm"
                        title={m.activeYn === "Y" ? "Deactivate" : "Activate"}
                        onClick={() => toggleModel(m)}
                      >
                        {m.activeYn === "Y" ? <FaTrash /> : <FaUndo />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="p-3">
        <Card className="shadow-sm">
          <Card.Header className="py-2">
            <strong>
              <i className="bx bx-cube me-2"></i>Asset Management
            </strong>
          </Card.Header>
          <Card.Body className="py-3">
            <Tabs activeKey={activeTab} onSelect={handleTab} className="mb-3">
              <Tab eventKey="Lift" title={`Lift Models (${models.filter((m) => m.assetType === "Lift").length})`}>
                {activeTab === "Lift" && modelTab}
              </Tab>
              <Tab eventKey="Generator" title={`Generator Models (${models.filter((m) => m.assetType === "Generator").length})`}>
                {activeTab === "Generator" && modelTab}
              </Tab>
              <Tab eventKey="Spare" title={`Spare Parts (${spares.length})`}>
                <Row className="g-2 align-items-end mb-3">
                  <Col xs={12} md={3}>
                    <Form.Label>Item Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      value={newSpare.itemName}
                      onChange={(e) => setNewSpare((p) => ({ ...p, itemName: e.target.value }))}
                      placeholder="e.g. Door Roller"
                    />
                  </Col>
                  <Col xs={6} md={2}>
                    <Form.Label>Group</Form.Label>
                    <Form.Control
                      value={newSpare.groupName}
                      onChange={(e) => setNewSpare((p) => ({ ...p, groupName: e.target.value }))}
                      placeholder="Lift Parts"
                    />
                  </Col>
                  <Col xs={3} md={1}>
                    <Form.Label>Unit</Form.Label>
                    <Form.Control
                      value={newSpare.unit}
                      onChange={(e) => setNewSpare((p) => ({ ...p, unit: e.target.value }))}
                      placeholder="Pcs"
                    />
                  </Col>
                  <Col xs={3} md={2}>
                    <Form.Label>Sale Price</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={newSpare.salePrice}
                      onChange={(e) => setNewSpare((p) => ({ ...p, salePrice: e.target.value }))}
                    />
                  </Col>
                  <Col xs={4} md={1}>
                    <Button
                      className="w-100"
                      style={{ backgroundColor: "#055fae" }}
                      onClick={addSpare}
                      disabled={saving}
                    >
                      <FaPlus />
                    </Button>
                  </Col>
                  <Col xs={8} md={3}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        value={spareSearch}
                        onChange={(e) => setSpareSearch(e.target.value)}
                        placeholder="Search name or group..."
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table striped bordered size="sm" className="mb-0">
                    <thead style={{ backgroundColor: "#e7e7ff" }}>
                      <tr>
                        <th style={{ width: "70px" }}>ID</th>
                        <th>Item Name</th>
                        <th>Group</th>
                        <th style={{ width: "80px" }}>Unit</th>
                        <th style={{ width: "110px" }} className="text-end">Sale Price</th>
                        <th style={{ width: "100px" }}>Status</th>
                        <th style={{ width: "110px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sparesLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-3">
                            <Spinner size="sm" animation="border" />
                          </td>
                        </tr>
                      ) : filteredSpares.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-3">
                            {spares.length === 0 ? "No spare parts yet" : "No items match the search"}
                          </td>
                        </tr>
                      ) : (
                        filteredSpares.map((s) => {
                          const inactive = spareInactive(s);
                          return (
                            <tr key={s.itemId} className={inactive ? "text-muted" : ""}>
                              <td>{s.itemId}</td>
                              <td>{s.itemName}</td>
                              <td>{s.groupName || "-"}</td>
                              <td>{s.unitName || "-"}</td>
                              <td className="text-end">{s.salePrice || "-"}</td>
                              <td>{statusBadge(!inactive)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    title="Edit"
                                    onClick={() => setEditSpare({ ...s })}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant={inactive ? "outline-success" : "outline-danger"}
                                    size="sm"
                                    title={inactive ? "Activate" : "Deactivate"}
                                    onClick={() =>
                                      inactive ? reactivateSpare(s) : deactivateSpare(s)
                                    }
                                  >
                                    {inactive ? <FaUndo /> : <FaTrash />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>

      {/* ---------- Edit Model modal ---------- */}
      <Modal show={!!editModel} onHide={() => setEditModel(null)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#055fae", color: "#fff" }}>
          <Modal.Title as="h6">Edit {editModel?.assetType} Model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Model / Brand Name</Form.Label>
          <Form.Control
            value={editModel?.modelName || ""}
            onChange={(e) =>
              setEditModel((p) => ({ ...p, modelName: e.target.value }))
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditModel(null)}>Cancel</Button>
          <Button style={{ backgroundColor: "#055fae" }} onClick={saveEditModel} disabled={saving}>
            <FaSave className="me-1" />Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------- Edit Spare modal ---------- */}
      <Modal show={!!editSpare} onHide={() => setEditSpare(null)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#055fae", color: "#fff" }}>
          <Modal.Title as="h6">Edit Spare Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col xs={12}>
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                value={editSpare?.itemName || ""}
                onChange={(e) => setEditSpare((p) => ({ ...p, itemName: e.target.value }))}
              />
            </Col>
            <Col xs={6}>
              <Form.Label>Group</Form.Label>
              <Form.Control
                value={editSpare?.groupName || ""}
                onChange={(e) => setEditSpare((p) => ({ ...p, groupName: e.target.value }))}
              />
            </Col>
            <Col xs={3}>
              <Form.Label>Unit</Form.Label>
              <Form.Control
                value={editSpare?.unitName || ""}
                onChange={(e) => setEditSpare((p) => ({ ...p, unitName: e.target.value }))}
              />
            </Col>
            <Col xs={3}>
              <Form.Label>Sale Price</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={editSpare?.salePrice || ""}
                onChange={(e) => setEditSpare((p) => ({ ...p, salePrice: e.target.value }))}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditSpare(null)}>Cancel</Button>
          <Button style={{ backgroundColor: "#055fae" }} onClick={saveEditSpare} disabled={saving}>
            <FaSave className="me-1" />Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
