// import { useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import { Link, useNavigate } from "react-router-dom";
// // import { MaintenancePage } from '../components/misc/MaintenancePage';

// export const DashboardPageAll = () => {
//   const { enableDashboardMode } = useAuth();

//   useEffect(() => {
//     enableDashboardMode();
//   }, [enableDashboardMode]);

//   return (
//     <div className="card bg-graduate">
//       <div className="card-body py-3">
//         <div className="row">
//           <div className="col-6 col-md-3 mb-2 ">
//             <Link to="/damage-zm-app?um=qc">
//               <div className="card bg-primary card-hover-sm">
//                 <div className="card-body text-center">
//                   <i className="bx bx-cart-add bx-lg text-white mb-3"></i>
//                   <h5 className="text-white">Damage Approval QC</h5>
//                 </div>
//               </div>
//             </Link>
//           </div>
//           <div className="col-6 col-md-3 mb-3">
//             <Link to="/web-order-process">
//               <div className="card bg-danger card-hover-sm">
//                 <div className="card-body text-center">
//                   <i className="bx bx-list-check bx-lg text-white mb-3"></i>
//                   <h5 className="text-white">Web Order Process</h5>
//                 </div>
//               </div>
//             </Link>
//           </div>
//           <div className="col-6 col-md-3 mb-2">
//             <Link to="/manual-do?UM=EXLD">
//               <div className="card bg-info card-hover-sm">
//                 <div className="card-body text-center">
//                   <i className="bx bx-package bx-lg text-white mb-3"></i>
//                   <h5 className="text-white">Excel Do</h5>
//                 </div>
//               </div>
//             </Link>
//           </div>
//           <div className="col-6 col-md-3 mb-2">
//             <Link to="/samr?MR=CASH">
//               <div className="card bg-warning card-hover-sm">
//                 <div className="card-body text-center">
//                   <i className="bx bx-task bx-lg text-white mb-3"></i>
//                   <h5 className="text-white">MR Cash Entry</h5>
//                 </div>
//               </div>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardPageAll.css";
// import { MaintenancePage } from '../components/misc/MaintenancePage';

const cards = [
  {
    to: "/damage-zm-app?um=qc",
    modifier: "dashboard-card--blue",
    icon: "bx bx-cart-add",
    label: "Quality Control",
    title: "Damage Approval QC",
  },
  {
    to: "/web-order-process",
    modifier: "dashboard-card--red",
    icon: "bx bx-list-check",
    label: "Order Management",
    title: "Web Order Process",
  },
  {
    to: "/manual-do?UM=EXLD",
    modifier: "dashboard-card--cyan",
    icon: "bx bx-package",
    label: "Operations",
    title: "Excel Do",
  },
  {
    to: "/samr?MR=CASH",
    modifier: "dashboard-card--amber",
    icon: "bx bx-task",
    label: "Finance",
    title: "MR Cash Entry",
  },
];

export const DashboardPageAll = () => {
  const { enableDashboardMode } = useAuth();

  useEffect(() => {
    enableDashboardMode();
  }, [enableDashboardMode]);

  return (
    <>
      <div className="card">
        <div className="dashboard-all">
          {/* Header */}
          <header className="dashboard-all__header">
            <p className="dashboard-all__eyebrow">Operations Hub</p>
            <h1 className="dashboard-all__title">
              Quick <span>Access</span> Panel
            </h1>
            <p className="dashboard-all__subtitle">
              Select a module to get started
            </p>
          </header>

          {/* Cards Grid */}
          <div className="dashboard-all__grid">
            {cards.map((card) => (
              <Link key={card.to} to={card.to} className="dashboard-card-link">
                <div className={`dashboard-card ${card.modifier}`}>
                  <div className="dashboard-card__icon-wrap">
                    <i className={`${card.icon}`}></i>
                  </div>
                  <div className="dashboard-card__content">
                    <span className="dashboard-card__label">{card.label}</span>
                    <h2 className="dashboard-card__title">{card.title}</h2>
                    <div className="dashboard-card__arrow">
                      Open module
                      <i className="bx bx-right-arrow-alt dashboard-card__arrow-icon"></i>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
