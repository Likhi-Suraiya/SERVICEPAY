import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboard, getTransactions } from "../api/dashboardapi";
import ThreeStringLoader from "../components/loader/ThreeStringLoader";

export const DashboardPage = () => {
  const { partnerId, user, userType } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isTrnxLoading, setIsTrnxLoading] = useState(false);
  const chartContainer = useRef(null);

  //------------------ Chart ---------------
  // Function to get last 6 months names
  const getLastSixMonths = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentDate = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      result.push(months[date.getMonth()]);
    }

    return result;
  };

  // Function to generate mock data for last 6 months
  const generateLastSixMonthsData = () => {
    const months = getLastSixMonths();

    // Generate random data for demonstration
    const thisYearData = months.map(
      () => Math.floor(Math.random() * 100) + 100
    );
    const lastYearData = thisYearData.map((value) =>
      Math.floor(value * (0.7 + Math.random() * 0.3))
    );

    return {
      months,
      thisYearData,
      lastYearData,
    };
  };

  // Initialize and render the chart
  useEffect(() => {
    if (chartContainer.current && window.CanvasJS) {
      const { months, thisYearData, lastYearData } =
        generateLastSixMonthsData();

      const chart = new window.CanvasJS.Chart(chartContainer.current, {
        animationEnabled: true,
        exportEnabled: true,
        theme: "light2",
        title: {
          text: "", //Last 6 Months Delivery Orders Comparison
          fontSize: 16,
        },
        axisX: {
          title: "", //Months
          interval: 1,
        },
        axisY: {
          title: "", //Amount (in BDT)
          suffix: "K",
          includeZero: true,
        },
        toolTip: {
          shared: true,
          content: "{name}: {y}",
        },
        legend: {
          cursor: "pointer",
          itemclick: function (e) {
            if (
              typeof e.dataSeries.visible === "undefined" ||
              e.dataSeries.visible
            ) {
              e.dataSeries.visible = false;
            } else {
              e.dataSeries.visible = true;
            }
            e.chart.render();
          },
        },
        data: [
          {
            type: "column",
            name: "This Year",
            showInLegend: true,
            color: "#28a745",
            indexLabel: "{y}",
            indexLabelFontSize: 11,
            indexLabelFontColor: "#000",
            indexLabelFontWeight: "bold",
            yValueFormatString: "#,##0K",
            dataPoints: months.map((month, index) => ({
              label: month,
              y: thisYearData[index],
            })),
          },
          {
            type: "column",
            name: "Last Year",
            showInLegend: true,
            color: "#17a2b8",
            indexLabel: "{y}",
            indexLabelFontSize: 11,
            indexLabelFontColor: "#000",
            indexLabelFontWeight: "bold",
            yValueFormatString: "#,##0K",
            dataPoints: months.map((month, index) => ({
              label: month,
              y: lastYearData[index],
            })),
          },
        ],
      });

      chart.render();

      // Cleanup function to avoid memory leaks
      return () => {
        if (chart && chart.destroy) {
          chart.destroy();
        }
      };
    }
  }, []);

  //----------------- Fetch Transactions ----------------

  const fetchTransactions = async () => {
    try {
      // Prepare request data with reportName
      setIsTrnxLoading(true);
      const requestData = {
        partnerId: partnerId,
        dbType: 1,
        reportName: "GET_DESHBOARD",
        fromDate: "",
        toDate: "",
        attribute1: "",
        attribute2: "",
        attribute3: "GET_TRANSACTIONS",
      };
      const transactionsResponse = await getTransactions(requestData);
      console.log("Transactions fetched:", transactionsResponse);
      if (transactionsResponse.successCode === "2000") {
        setTransactions(transactionsResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setIsTrnxLoading(false);
    }
  };

  // ----------------- Fetch Dashboard Data ----------------

  const fetchDashboardData = async () => {
    try {
      // Prepare request data with reportName
      setIsDashboardLoading(true);
      const requestData = {
        partnerId: partnerId,
        dbType: 1,
        reportName: "GET_DESHBOARD",
        fromDate: "",
        toDate: "",
        attribute1: "",
        attribute2: "",
        attribute3: "GET_DB",
      };
      const dashboardResponse = await getDashboard(requestData);
      console.log("Dashboard fetched:", dashboardResponse);
      if (dashboardResponse.successCode === "2000") {
        setDashboardData(dashboardResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching Dashboard", error);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Find the BLOCK_11 data which contains the metrics
  const metricsData = dashboardData?.find(
    (item) => item.BLOCK_NAME === "BLOCK_11"
  );
  const block10Data = dashboardData?.find(
    (item) => item.BLOCK_NAME === "BLOCK_10"
  );

  // Fetch orders on component mount and when partnerId changes
  useEffect(() => {
    dashboardAnalitics();
    fetchTransactions();
    fetchDashboardData();
  }, [partnerId]);

  return (
    <>
      <div className="row">
        <div className="col-lg-8 mb-2 order-0">
          {(isDashboardLoading || isTrnxLoading) && <ThreeStringLoader />}
          <div className="card">
            <div className="d-flex align-items-end row">
              <div className="col-sm-7">
                <div className="card-body">
                  {/* <h5 className="card-title text-primary">
                    Congratulations {userType === "H" ? "MR. " : ""}
                    {user?.staffName}! 🎉
                  </h5> */}
                  {/* <p className="mb-2">
                    You have done <span className="fw-medium">72%</span> more
                    sales today. Check your new badge in your profile.
                  </p> */}
                  {/* <h5 className="card-title text-primary">
                    {block10Data ? block10Data.DATA1 : ""}
                  </h5>
                  <p className="mb-0 mb-lg-4">
                    {block10Data ? block10Data.DATA2 : ""}
                  </p> */}
                  <p
                    className="mb-0 mb-lg-4"
                    dangerouslySetInnerHTML={{
                      __html: block10Data ? block10Data.DATA1 : "",
                    }}
                  ></p>
                  {/* <a
                    aria-label="view badges"
                    href="#"
                    className="btn btn-sm btn-outline-primary"
                  >
                    View Badges
                  </a> */}
                </div>
              </div>
              <div className="col-sm-5 text-center text-sm-left">
                <div className="card-body pb-0 px-0 px-md-4">
                  <img
                    aria-label="dsahboard icon image"
                    // src="/assets/img/illustrations/man-with-laptop-light.png"
                    src="/assets/img/Order360_Logo_sm.png"
                    height="140"
                    alt="View Badge User"
                    // data-app-dark-img="illustrations/man-with-laptop-dark.png"
                    // data-app-light-img="illustrations/man-with-laptop-light.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-4 order-1">
          <div className="row">
            <div className="col-lg-6 col-md-12 col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/chart-success.png"
                        alt="chart success"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt3"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="cardOpt3"
                      >
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA1 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA2
                      ? Number(metricsData.DATA2).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA3.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA3.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA3 : "0"}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/wallet-info.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt6"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="cardOpt6"
                      >
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA4 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA5
                      ? Number(metricsData.DATA5).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA6.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA6.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA6 : "0"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*================== Achievement Comparison =================*/}

        {/* Replaced Total Revenue and Growth Chart with Monthly Delivery Orders Chart */}
        <div className="col-12 col-lg-8 order-2 order-md-3 order-lg-2 mb-2">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="m-0">Achievement Comparison</h5>
            </div>
            <div className="card-body">
              <div
                ref={chartContainer}
                style={{ height: "400px", width: "100%" }}
              />
            </div>
          </div>
        </div>
        {/* <div className="col-12 col-lg-8 order-2 order-md-3 order-lg-2 mb-2">
          <div className="card">
            <div className="row row-bordered g-0">
              <div className="col-md-8">
                <h5 className="card-header m-0 me-2 pb-3">Total Revenue</h5>
                <div id="totalRevenueChart" className="px-2"></div>
              </div>
              <div className="col-md-4">
                <div className="card-body">
                  <div className="text-center">
                    <div className="dropdown">
                      <button
                        aria-label="Years selection 2022"
                        className="btn btn-sm btn-outline-primary dropdown-toggle"
                        type="button"
                        id="growthReportId"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        2022
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="growthReportId"
                      >
                        <a
                          aria-label="dropdown item 2021"
                          className="dropdown-item"
                          href="#"
                        >
                          2021
                        </a>
                        <a
                          aria-label="dropdown item 2020"
                          className="dropdown-item"
                          href="#"
                        >
                          2020
                        </a>
                        <a
                          aria-label="dropdown item 2019"
                          className="dropdown-item"
                          href="#"
                        >
                          2019
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="growthChart"></div>
                <div className="text-center fw-medium pt-3 mb-2">
                  62% Company Growth
                </div>

                <div className="d-flex px-xxl-4 px-lg-2 p-4 gap-xxl-3 gap-lg-1 gap-3 justify-content-between">
                  <div className="d-flex">
                    <div className="me-2">
                      <span className="badge bg-label-primary p-2">
                        <i className="bx bx-dollar text-primary"></i>
                      </span>
                    </div>
                    <div className="d-flex flex-column">
                      <small>2022</small>
                      <h6 className="mb-0">$32.5k</h6>
                    </div>
                  </div>
                  <div className="d-flex">
                    <div className="me-2">
                      <span className="badge bg-label-info p-2">
                        <i className="bx bx-wallet text-info"></i>
                      </span>
                    </div>
                    <div className="d-flex flex-column">
                      <small>2021</small>
                      <h6 className="mb-0">$41.2k</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        <div className="col-12 col-md-8 col-lg-4 order-3 order-md-2">
          <div className="row">
            <div className="col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/wallet-primary.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt4"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="cardOpt4"
                      >
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA7 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA8
                      ? Number(metricsData.DATA8).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA9.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA9.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA9 : "0"}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/paypal.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt1"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu" aria-labelledby="cardOpt1">
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA10 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA11
                      ? Number(metricsData.DATA11).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA12.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA12.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA12 : "0"}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/cc-primary.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt1"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu" aria-labelledby="cardOpt1">
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA13 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA14
                      ? Number(metricsData.DATA14).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA15.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA15.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA15 : "0"}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-6 mb-2">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/charts.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt1"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu" aria-labelledby="cardOpt1">
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    {metricsData ? metricsData.DATA16 : ""}
                  </span>
                  <h3 className="card-title mb-2">
                    ৳
                    {metricsData && metricsData.DATA17
                      ? Number(metricsData.DATA17).toLocaleString()
                      : "0"}
                  </h3>
                  <small
                    className={
                      metricsData && metricsData.DATA18.startsWith("-")
                        ? "text-danger fw-medium"
                        : "text-success fw-medium"
                    }
                  >
                    <i
                      className={
                        metricsData && metricsData.DATA18.startsWith("-")
                          ? "bx bx-down-arrow-alt"
                          : "bx bx-up-arrow-alt"
                      }
                    ></i>{" "}
                    {metricsData ? metricsData.DATA18 : "0"}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 mb-5 mb-lg-2">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between flex-sm-row flex-column gap-3">
                    <div className="d-flex flex-sm-column flex-row align-items-start justify-content-between">
                      <div className="card-title">
                        <h5 className="text-nowrap mb-2">DO Ratio</h5>
                        <span className="badge bg-label-warning rounded-pill">
                          Year 2025
                        </span>
                      </div>
                      <div className="mt-sm-auto">
                        <small className="text-success text-nowrap fw-medium">
                          <i className="bx bx-chevron-up"></i> 0%
                        </small>
                        <h3 className="mb-0">৳0k</h3>
                      </div>
                    </div>
                    <div id="profileReportChart"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        {/* <div className="col-md-6 col-lg-4 col-xl-4 order-0 mb-2">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between pb-0">
              <div className="card-title mb-0">
                <h5 className="m-0 me-2">Order Statistics</h5>
                <small className="text-muted">42.82k Total Sales</small>
              </div>
              <div className="dropdown">
                <button
                  aria-label="Click me"
                  className="btn p-0"
                  type="button"
                  id="orederStatistics"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="bx bx-dots-vertical-rounded"></i>
                </button>
                <div
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="orederStatistics"
                >
                  <a
                    aria-label="select all "
                    className="dropdown-item"
                    href="#"
                  >
                    Select All
                  </a>
                  <a aria-label="refresh" className="dropdown-item" href="#">
                    Refresh
                  </a>
                  <a aria-label="share" className="dropdown-item" href="#">
                    Share
                  </a>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex flex-column align-items-center gap-1">
                  <h2 className="mb-2">8,258</h2>
                  <span>Total Orders</span>
                </div>
                <div id="orderStatisticsChart"></div>
              </div>
              <ul className="p-0 m-0">
                <li className="d-flex mb-4 pb-1">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-mobile-alt"></i>
                    </span>
                  </div>
                  <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div className="me-2">
                      <h6 className="mb-0">Electronic</h6>
                      <small className="text-muted">Mobile, Earbuds, TV</small>
                    </div>
                    <div className="user-progress">
                      <small className="fw-medium">82.5k</small>
                    </div>
                  </div>
                </li>
                <li className="d-flex mb-4 pb-1">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-closet"></i>
                    </span>
                  </div>
                  <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div className="me-2">
                      <h6 className="mb-0">Fashion</h6>
                      <small className="text-muted">
                        T-shirt, Jeans, Shoes
                      </small>
                    </div>
                    <div className="user-progress">
                      <small className="fw-medium">23.8k</small>
                    </div>
                  </div>
                </li>
                <li className="d-flex mb-4 pb-1">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-home-alt"></i>
                    </span>
                  </div>
                  <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div className="me-2">
                      <h6 className="mb-0">Decor</h6>
                      <small className="text-muted">Fine Art, Dining</small>
                    </div>
                    <div className="user-progress">
                      <small className="fw-medium">849k</small>
                    </div>
                  </div>
                </li>
                <li className="d-flex">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-secondary">
                      <i className="bx bx-football"></i>
                    </span>
                  </div>
                  <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div className="me-2">
                      <h6 className="mb-0">Sports</h6>
                      <small className="text-muted">
                        Football, Cricket Kit
                      </small>
                    </div>
                    <div className="user-progress">
                      <small className="fw-medium">99</small>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div> */}
        {/* <div className="col-md-6 col-lg-4 order-1 mb-2">
          <div className="card h-100">
            <div className="card-header">
              <ul className="nav nav-pills" role="tablist">
                <li className="nav-item" role="presentation">
                  <a
                    aria-label="Select Income Tab"
                    className="nav-link active"
                    id="navs-tabs-line-card-income-tab"
                    data-bs-toggle="tab"
                    href="#navs-tabs-line-card-income"
                    role="tab"
                    aria-controls="navs-tabs-line-card-income"
                    aria-selected="true"
                  >
                    Income
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    aria-label="Select Expenses Tab"
                    className="nav-link"
                    id="navs-tabs-line-card-expenses-tab"
                    data-bs-toggle="tab"
                    href="#navs-tabs-line-card-expenses"
                    role="tab"
                    aria-controls="navs-tabs-line-card-expenses"
                    aria-selected="false"
                  >
                    Expenses
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    aria-label="Select Profit Tab"
                    className="nav-link"
                    id="navs-tabs-line-card-profit-tab"
                    data-bs-toggle="tab"
                    href="#navs-tabs-line-card-profit"
                    role="tab"
                    aria-controls="navs-tabs-line-card-profit"
                    aria-selected="false"
                  >
                    Profit
                  </a>
                </li>
              </ul>
            </div>
            <div className="card-body px-0">
              <div className="tab-content p-0">
                <div
                  className="tab-pane fade show active"
                  id="navs-tabs-line-card-income"
                  role="tabpanel"
                  aria-labelledby="navs-tabs-line-card-income"
                >
                  <div className="d-flex p-4 pt-3">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        aria-label="Dashboard Icon Image"
                        src="/assets/img/icons/unicons/wallet.png"
                        alt="User"
                      />
                    </div>
                    <div>
                      <small className="text-muted d-block">
                        Total Balance
                      </small>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-1">$459.10</h6>
                        <small className="text-success fw-medium">
                          <i className="bx bx-chevron-up"></i>
                          42.9% Increase
                        </small>
                      </div>
                    </div>
                  </div>
                  <div
                    id="incomeChart Jan Feb Mar Apr May Jun Jul"
                    aria-label="Income Chart"
                  ></div>
                  <div className="d-flex justify-content-center pt-4 gap-2">
                    <div className="flex-shrink-0">
                      <div
                        id="expensesOfWeek"
                        aria-label="Expenses of the Week $65"
                      ></div>
                    </div>
                    <div>
                      <p className="mb-n1 mt-1">Expenses This Week</p>
                      <small className="text-muted">
                        $39 less than last week
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* <div className="col-md-6 col-lg-4 order-2 mb-2">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title m-0 me-2">Transactions</h5>
              <div className="dropdown">
                <button
                  aria-label="Transactions"
                  className="btn p-0"
                  type="button"
                  id="transactionID"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="bx bx-dots-vertical-rounded"></i>
                </button>
                <div
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="transactionID"
                >
                  <a
                    aria-label="dropdown item Last 28 Days"
                    className="dropdown-item"
                    href="#"
                  >
                    Last 28 Days
                  </a>
                  <a
                    aria-label="dropdown item Last Month"
                    className="dropdown-item"
                    href="#"
                  >
                    Last Month
                  </a>
                  <a
                    aria-label="dropdown item Last Year"
                    className="dropdown-item"
                    href="#"
                  >
                    Last Year
                  </a>
                </div>
              </div>
            </div>
            <div className="card-body">
              <ul className="p-0 m-0">
                {transactions.map((transaction, index) => (
                  <li key={index} className="d-flex mb-4 pb-1">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        aria-label="transaction icon"
                        src="/assets/img/icons/unicons/cc-primary.png"
                        alt="Transaction"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="text-muted d-block mb-1">
                          {transaction.DO_DATE}
                        </small>
                        <h6 className="mb-0">{transaction.QTY} Orders</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-1">
                        <h6 className="mb-0">
                          {transaction.AMOUNT.toFixed(2)}
                        </h6>
                        <span className="text-muted">BDT</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
};
