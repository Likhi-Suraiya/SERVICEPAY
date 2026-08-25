import { useState, useEffect } from "react";
import "./user-profile.css";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import ThreeStringLoader from "../../components/loader/ThreeStringLoader";

export const UserProfile = () => {
  const { partnerId, user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("distributor");
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [distributorLogisticsData, setDistributorLogisticsData] = useState([]);
  const [editableLogisticsData, setEditableLogisticsData] = useState([]);
  const [savedDistributorLogisticsData, setSavedDistributorLogisticsData] =
    useState([]);
  const [formData, setFormData] = useState({
    // Distributor Info
    organizationName: "",
    proprietorName: "",
    address1: "",
    address2: "",
    address3: "",
    contactNumber: "",
    group: "",
    zone: "",
    depotCode: "",
    tsmRegion: "",
    nid: "",
    tradeLicence: "",
    creditLimit: "",
    securityDeposit: "",
  });

  const [profileData, setProfileData] = useState({
    DIST_ID: "",
    SALES_ZONE: "",
    OPENING_DATE: "",
    IMAGE: "",
    REGION_ID: "",
    THANA: "",
  });

  const [staffData, setStaffData] = useState({
    tsm: [],
    sr: [],
    hos: [],
  });

  //====================== Validation Methods ======================

  const validateContribution = (value) => {
    const numValue = parseInt(value);

    if (value === "" || (numValue >= 0 && numValue <= 100)) {
      return { isValid: true, message: "" };
    } else if (numValue > 100) {
      return { isValid: false, message: "Contribution cannot exceed 100%" };
    } else if (numValue < 0) {
      return { isValid: false, message: "Contribution cannot be negative" };
    }

    return { isValid: false, message: "Invalid contribution value" };
  };

  const validateRemarks = (value) => {
    if (!value.trim()) {
      return { isValid: true, message: "" }; // Empty remarks are allowed
    }

    if (value.trim().length < 10) {
      return {
        isValid: false,
        message: "Remarks must be at least 10 characters",
      };
    }

    return { isValid: true, message: "" };
  };

  const validateAllLogisticsData = () => {
    let isValid = true;

    const errors = [];

    for (const [index, logistic] of editableLogisticsData.entries()) {
      const contribution = parseInt(logistic.CONTRIBUTION) || 0;
      const contributionValidation = validateContribution(contribution);

      if (!contributionValidation.isValid) {
        isValid = false;
        errors.push(`Row ${index + 1}: ${contributionValidation.message}`);
      }

      const remarksValidation = validateRemarks(logistic.REMARKS || "");

      if (!remarksValidation.isValid) {
        isValid = false;
        errors.push(`Row ${index + 1}: ${remarksValidation.message}`);
      }
    }

    return { isValid, errors };
  };

  const validateSingleLogisticsRow = (index, field, value) => {
    if (field === "CONTRIBUTION") {
      return validateContribution(value);
    } else if (field === "REMARKS") {
      return validateRemarks(value);
    }

    return { isValid: true, message: "" };
  };

  // Check for navigation state and set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  //----------------- Fetch Distributor Profile Data ----------------

  // Fetch distributor profile data on component mount
  useEffect(() => {
    const fetchDistributorData = async () => {
      try {
        setLoading(true);
        const requestData = {
          staffId: partnerId,
          dbType: 1,
          reportName: "DISTRIBUTOR_PROFILE",
          fromDate: "",
          toDate: "",
          attribute1: "",
          attribute2: "",
          attribute3: "",
        };

        const response = await getDistributorsProfileInfo(requestData);
        console.log("Distributor Info fetched:", response);
        if (response.successCode === "2000") {
          const distributorData = response.data[0];

          setFormData((prev) => ({
            ...prev,
            // Map API response to form fields
            organizationName: distributorData.ORGANIZATION_NAME || "",
            proprietorName: distributorData.PROPRIETOR_NAME || "",
            address1: distributorData.ADDRESS1 || "",
            address2: distributorData.ADDRESS2 || "",
            address3: distributorData.ADDRESS3 || "",
            contactNumber: distributorData.CONTACT || "",
            group: distributorData.GROUP_NAME || "",
            zone: distributorData.SALES_ZONE || "",
            depotCode: distributorData.DEPOT_CODE || "",
            //tsmRegion: distributorData.REGION_ID || "", // Using REGION_ID from API
            nid: distributorData.NID || "",
            creditLimit: distributorData.CR_LIMIT?.toString() || "",
            securityDeposit: distributorData.SECURITY_DEPOSIT?.toString() || "",
          }));

          setProfileData({
            DIST_ID: distributorData.DIST_ID || "",
            SALES_ZONE: distributorData.SALES_ZONE || "",
            OPENING_DATE: distributorData.OPENING_DATE || "",
            IMAGE: distributorData.IMAGE || "",
            THANA: distributorData.THANA || "",
            REGION_ID: distributorData.REGION_ID || "",
          });
        }
      } catch (err) {
        console.error("Error fetching distributor data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributorData();
  }, [partnerId]);

  //----------------- Fetch Distributor Logistic Data ----------------

  // Fetch distributor logistic data when activeTab is "distLogistic"
  useEffect(() => {
    const fetchDistributorLogisticsData = async () => {
      try {
        setLoading(true);
        const requestData = {
          partnerId: partnerId,
        };

        console.log(
          "Fetching distributor logistics with requestData:",
          requestData,
        );
        const response = await getDistLogisticsProfileInfo(requestData);

        console.log("Distributor Logistics Info fetched:", response);
        if (response.successCode === "2000") {
          const logisticsData = response.data || [];
          setDistributorLogisticsData(logisticsData);
          setEditableLogisticsData(logisticsData);
          setSavedDistributorLogisticsData(logisticsData);
        }
      } catch (err) {
        console.error("Error fetching distributor logistics data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "distLogistic") {
      fetchDistributorLogisticsData();
    }
  }, [partnerId, activeTab]);

  //----------------- Save Distributor Logistic Data ----------------

  const handleSaveDistLogisticsData = async () => {
    try {
      // Validate all logistics data before saving
      const validationResult = validateAllLogisticsData();

      if (!validationResult.isValid) {
        validationResult.errors.forEach((error) => toast.error(error));
        return;
      }

      setLoading(true);

      // Validate data before saving
      if (!editableLogisticsData || editableLogisticsData.length === 0) {
        toast.warning("No logistics data to save");
        return;
      }

      // Prepare the data for all logistics items
      const logisticsToSave = editableLogisticsData.map((logistic) => ({
        id: logistic.ID.toString(),
        name: logistic.NAME,
        qty: logistic.QTY ? logistic.QTY.toString() : "0",
        contribution: logistic.CONTRIBUTION
          ? logistic.CONTRIBUTION.toString()
          : "0",
        remarks: logistic.REMARKS || "",
      }));

      const requestData = {
        partnerId: partnerId,
        userId: user?.staffId || partnerId,
        dbType: "1",
        data: logisticsToSave,
      };

      const response = await saveDistLogisticsProfileInfo(requestData);

      if (response.successCode === "2000") {
        // Update both states to reflect the saved data
        const updatedData = [...editableLogisticsData];
        setSavedDistributorLogisticsData(updatedData);
        setDistributorLogisticsData(updatedData);
        toast.success("Distributor logistics data saved successfully!");
      } else {
        toast.error("Failed to save logistics data");
      }
    } catch (err) {
      console.error("Error saving distributor logistics data:", err);
      toast.error("Error saving logistics data");
    } finally {
      setLoading(false);
    }
  };

  //----------------- Fetch Staff Data (TSM, SR, HOS) ----------------
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setStaffLoading(true);
        const requestData = {
          staffId: partnerId,
          dbType: 1,
          reportName: "LOAD_SRZM",
          fromDate: "",
          toDate: "",
          attribute1: "",
          attribute2: "",
          attribute3: "",
        };

        const response = await getDistributorsProfileInfo(requestData);
        console.log("Staff Info fetched:", response);

        if (response.successCode === "2000" && response.data) {
          const staffData = response.data;

          // Filter data by TYPE_ID
          const tsmData = staffData.filter((item) => item.TYPE_ID === "ZM");
          const srData = staffData.filter((item) => item.TYPE_ID === "SR");
          const hosData = staffData.filter((item) => item.TYPE_ID === "HOS");

          setStaffData({
            tsm: tsmData,
            sr: srData,
            hos: hosData,
          });
        }
      } catch (err) {
        console.error("Error fetching staff data:", err);
      } finally {
        setStaffLoading(false);
      }
    };

    if (activeTab !== "distributor") {
      fetchStaffData();
    }
  }, [partnerId, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogisticsChange = (index, field, value) => {
    // Use validation method
    const validationResult = validateSingleLogisticsRow(index, field, value);

    if (!validationResult.isValid && validationResult.message) {
      // toast.warning(validationResult.message);
      // Still allow the change but show warning
    }

    // Update the data regardless (to allow user to fix)
    setEditableLogisticsData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add a function to check if data has changed

  const hasChanges = () => {
    if (
      !savedDistributorLogisticsData.length &&
      !editableLogisticsData.length
    ) {
      return false;
    }

    if (savedDistributorLogisticsData.length !== editableLogisticsData.length) {
      return true;
    }

    return savedDistributorLogisticsData.some((savedItem, index) => {
      const editableItem = editableLogisticsData[index];
      return (
        (savedItem.QTY || "0") !== (editableItem.QTY || "0") ||
        (savedItem.CONTRIBUTION || "0") !==
          (editableItem.CONTRIBUTION || "0") ||
        (savedItem.REMARKS || "") !== (editableItem.REMARKS || "")
      );
    });
  };

  return (
    <>
      <div>
        <ToastContainer position="top-right" />
        {(loading || staffLoading) && <ThreeStringLoader />}
        <div className="row">
          {/* ==================== Profile Header ==================== */}

          <div className="col-12">
            <div className="card mb-4">
              <div className="user-profile-header-banner">
                <img
                  src="../../assets/img/default-banner.jpg"
                  alt="Banner image"
                  className="card-img-top rounded-top"
                  style={{ height: "200px", objectFit: "cover" }}
                />
              </div>
              <div className="card-body position-relative">
                <div className="d-flex flex-column flex-md-row align-items-center align-items-md-start">
                  <div className="flex-shrink-0 mb-3 mb-md-0 me-md-4">
                    <img
                      src={profileData.IMAGE}
                      alt="user image"
                      className="rounded-circle border border-4 border-white shadow user-profile-img"
                      style={{
                        width: "150px",
                        height: "150px",
                        marginTop: "-75px",
                      }}
                    />
                  </div>
                  <div className="flex-grow-1 text-center text-md-start">
                    <h2 className="mb-2">
                      {formData.organizationName || ""}{" "}
                      <span className="text-muted fs-5">
                        ({profileData.DIST_ID || ""})
                      </span>
                    </h2>

                    <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-4 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-palette me-2 text-primary"></i>
                        <span className="fw-medium">
                          {formData.group || ""}
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bx bx-map me-2 text-primary"></i>
                        <span className="fw-medium">
                          {profileData.THANA || ""}
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bx bx-calendar me-2 text-primary"></i>
                        <span className="fw-medium">
                          {profileData.OPENING_DATE || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== Tabs Navigation ==================== */}

          <div>
            <div className="nav-align-top mb-4">
              <ul className="nav nav-tabs nav-fill" role="tablist">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${
                      activeTab === "distributor" ? "active" : ""
                    }`}
                    role="tab"
                    onClick={() => setActiveTab("distributor")}
                    aria-selected={activeTab === "distributor"}
                  >
                    <i className="bx bx-building me-1 d-none d-sm-block"></i>
                    <span className="">Info</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${
                      activeTab === "distLogistic" ? "active" : ""
                    }`}
                    role="tab"
                    onClick={() => setActiveTab("distLogistic")}
                    aria-selected={activeTab === "distLogistic"}
                  >
                    <i className="bx bx-cart me-1 d-none d-sm-block"></i>
                    <span className="">Logistics</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${
                      activeTab === "hos" ? "active" : ""
                    }`}
                    role="tab"
                    onClick={() => setActiveTab("hos")}
                    aria-selected={activeTab === "hos"}
                  >
                    <i className="bx bx-user-circle me-1 d-none d-sm-block"></i>
                    <span className="">HOS</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${
                      activeTab === "tsm" ? "active" : ""
                    }`}
                    role="tab"
                    onClick={() => setActiveTab("tsm")}
                    aria-selected={activeTab === "tsm"}
                  >
                    <i className="bx bx-user me-1 d-none d-sm-block"></i>
                    <span className="">TSM</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === "sr" ? "active" : ""}`}
                    role="tab"
                    onClick={() => setActiveTab("sr")}
                    aria-selected={activeTab === "sr"}
                  >
                    <i className="bx bx-group me-1 d-none d-sm-block"></i>
                    <span className="">SR</span>
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Distributor Info Tab */}
                <div
                  className={`tab-pane fade ${
                    activeTab === "distributor" ? "show active" : ""
                  }`}
                >
                  <div className="card-body">
                    <h4 className="mb-4">Distributor Information</h4>

                    <div className="row mb-5">
                      {/* Organization Name */}
                      <div className="col-6 col-md-6 col-xl-5 mb-3">
                        <label
                          htmlFor="organizationName"
                          className="form-label small"
                        >
                          Organization Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          id="organizationName"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Proprietor Name */}
                      <div className="col-6 col-md-6 col-xl-4 mb-3">
                        <label
                          htmlFor="proprietorName"
                          className="form-label small"
                        >
                          Proprietor Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          id="proprietorName"
                          name="proprietorName"
                          value={formData.proprietorName}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Zone */}
                      <div className="col-6 col-md-6 col-xl-3 mb-3">
                        <label htmlFor="zone" className="form-label small">
                          Zone
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          id="zone"
                          name="zone"
                          value={`${profileData.SALES_ZONE} (${profileData.REGION_ID})`}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Address1 */}
                      <div className="col-6 col-md-6 col-xl-5 mb-3">
                        <label htmlFor="address1" className="form-label small">
                          Address1
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          id="address1"
                          name="address1"
                          value={formData.address1}
                          onChange={handleInputChange}
                          rows="1"
                          disabled
                          required
                        ></textarea>
                      </div>

                      {/* Address2 */}
                      <div className="col-6 col-md-6 col-xl-4 mb-3">
                        <label htmlFor="address2" className="form-label small">
                          Address2
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          id="address2"
                          name="address2"
                          value={formData.address2}
                          onChange={handleInputChange}
                          rows="1"
                          disabled
                          required
                        ></textarea>
                      </div>

                      {/* Address3 */}
                      <div className="col-6 col-md-6 col-xl-3 mb-3">
                        <label htmlFor="address3" className="form-label small">
                          Address3
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          id="address3"
                          name="address3"
                          value={formData.address3}
                          onChange={handleInputChange}
                          rows="1"
                          disabled
                          required
                        ></textarea>
                      </div>

                      {/* Contact Number */}
                      <div className="col-6 col-md-6 col-xl-5 mb-3">
                        <label
                          htmlFor="contactNumber"
                          className="form-label small"
                        >
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="contactNumber"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* NID */}
                      <div className="col-6 col-md-6 col-xl-4 mb-3">
                        <label htmlFor="nid" className="form-label small">
                          NID
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="nid"
                          name="nid"
                          value={formData.nid}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Trade Licence */}
                      <div className="col-6 col-md-6 col-xl-3 mb-3">
                        <label
                          htmlFor="tradeLicence"
                          className="form-label small"
                        >
                          Trade Licence
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="tradeLicence"
                          name="tradeLicence"
                          value={formData.tradeLicence}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Religion */}
                      <div className="col-6 col-md-6 col-xl-5 mb-3">
                        <label htmlFor="tsmRegion" className="form-label small">
                          Religion
                        </label>
                        <select
                          className="form-select form-select-sm"
                          id="tsmRegion"
                          name="tsmRegion"
                          value={formData.tsmRegion}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Religion</option>
                          <option value="1">Islam</option>
                          <option value="2">Hinduism</option>
                          <option value="3">Buddhism</option>
                          <option value="4">Christianity</option>
                        </select>
                      </div>

                      {/* Depot Code */}
                      <div className="col-6 col-md-6 col-xl-4 mb-3">
                        <label htmlFor="depotCode" className="form-label small">
                          Depot Code
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="depotCode"
                          name="depotCode"
                          value={formData.depotCode}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Credit Limit */}
                      <div className="col-6 col-md-6 col-xl-3 mb-3">
                        <label
                          htmlFor="creditLimit"
                          className="form-label small"
                        >
                          Credit Limit
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="creditLimit"
                          name="creditLimit"
                          value={formData.creditLimit}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>

                      {/* Security Deposit */}
                      <div className="col-6 col-md-6 col-xl-5 mb-3">
                        <label
                          htmlFor="securityDeposit"
                          className="form-label small"
                        >
                          Security Deposit
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          id="securityDeposit"
                          name="securityDeposit"
                          value={formData.securityDeposit}
                          onChange={handleInputChange}
                          disabled
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distibutor Logistic Info Tab */}
                <div
                  className={`tab-pane fade ${
                    activeTab === "distLogistic" ? "show active" : ""
                  }`}
                >
                  <div className="card-body">
                    <h4 className="mb-4">Distributor Logistic Information</h4>

                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            {/* <th>ID</th> */}
                            <th>Name</th>
                            {/* <th>DIST_ID</th> */}
                            <th>Qty</th>
                            <th className="text-nowrap">Contribution (%)</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editableLogisticsData &&
                          editableLogisticsData.length > 0 ? (
                            editableLogisticsData.map((logistic, index) => {
                              // Check validation for each row
                              const contributionValidation =
                                validateContribution(
                                  logistic.CONTRIBUTION || "",
                                );
                              const remarksValidation = validateRemarks(
                                logistic.REMARKS || "",
                              );
                              return (
                                <tr key={index} className="small">
                                  <td>{logistic.NAME}</td>
                                  <td className="align-middle px-1 py-1">
                                    <input
                                      type="number"
                                      // className="form-control form-control-sm w-50 w-md-100 w-sm-100"
                                      className="form-control form-control-sm w-100 w-md-75 w-lg-50"
                                      value={logistic.QTY || ""}
                                      onChange={(e) =>
                                        handleLogisticsChange(
                                          index,
                                          "QTY",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="align-middle">
                                    <input
                                      type="number"
                                      className={`form-control form-control-sm w-100 w-md-75 w-lg-50 ${
                                        !contributionValidation.isValid
                                          ? "is-invalid"
                                          : ""
                                      }`}
                                      value={logistic.CONTRIBUTION || ""}
                                      onChange={(e) =>
                                        handleLogisticsChange(
                                          index,
                                          "CONTRIBUTION",
                                          e.target.value,
                                        )
                                      }
                                      min="0"
                                      max="100"
                                    />

                                    {!contributionValidation.isValid && (
                                      <div className="invalid-feedback">
                                        {contributionValidation.message}
                                      </div>
                                    )}
                                  </td>
                                  <td className="align-middle">
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm w-100 w-md-75 w-lg-50 ${
                                        !remarksValidation.isValid
                                          ? "is-invalid"
                                          : ""
                                      }`}
                                      value={logistic.REMARKS || ""}
                                      onChange={(e) =>
                                        handleLogisticsChange(
                                          index,
                                          "REMARKS",
                                          e.target.value,
                                        )
                                      }
                                    />

                                    {!remarksValidation.isValid && (
                                      <div className="invalid-feedback">
                                        {remarksValidation.message}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted"
                              >
                                No logistics data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveDistLogisticsData}
                          disabled={loading || !hasChanges()}
                        >
                          {loading ? "Saving..." : "Save"}
                        </button>
                        {hasChanges() && !loading && (
                          <span className="text-warning small ms-2">
                            * Unsaved changes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HOS Info Tab */}
                <div
                  className={`tab-pane fade ${
                    activeTab === "hos" ? "show active" : ""
                  }`}
                >
                  <div className="card-body">
                    <h4 className="mb-4">HOS Information</h4>

                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            {/* <th>Staff ID</th> */}
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffData.hos.map((staff, index) => (
                            <tr key={index} className="small">
                              {/* <td className="fw-semibold">{staff.STAFF_ID}</td> */}
                              <td>{staff.STAFF_NAME}</td>
                              <td>{staff.MOBILE || "N/A"}</td>
                              <td>{staff.EMAIL || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* TSM Info Tab */}
                <div
                  className={`tab-pane fade ${
                    activeTab === "tsm" ? "show active" : ""
                  }`}
                >
                  <div className="card-body">
                    <h4 className="mb-4">TSM Information</h4>

                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            {/* <th>Staff ID</th> */}
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffData.tsm.map((staff, index) => (
                            <tr key={index} className="small">
                              {/* <td className="fw-semibold">{staff.STAFF_ID}</td> */}
                              <td>{staff.STAFF_NAME}</td>
                              <td>{staff.MOBILE || "N/A"}</td>
                              <td>{staff.EMAIL || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* SR Info Tab */}
                <div
                  className={`tab-pane fade ${
                    activeTab === "sr" ? "show active" : ""
                  }`}
                >
                  <div className="card-body">
                    <h4 className="mb-4">SR Information</h4>

                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            {/* <th>Staff ID</th> */}
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>SR Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffData.sr.map((staff, index) => (
                            <tr key={index} className="small">
                              {/* <td className="fw-semibold">{staff.STAFF_ID}</td> */}
                              <td>{staff.STAFF_NAME}</td>
                              <td>{staff.MOBILE || "N/A"}</td>
                              <td>{staff.EMAIL || "N/A"}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    staff.SR_PERCENT === 100
                                      ? "bg-success"
                                      : "bg-warning"
                                  }`}
                                >
                                  {staff.SR_PERCENT}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
