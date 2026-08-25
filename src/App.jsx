import { useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import AppRoutes from "./router/AppRoutes";
import { Blank } from "./layouts/Blank";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const location = useLocation();
  const isAuthPath =
    location.pathname.startsWith("/portal") || // customer portal: no staff shell
    location.pathname.includes("auth") ||
    location.pathname.includes("error") ||
    location.pathname.includes("under-maintenance") ||
    location.pathname.includes("blank") ||
    location.pathname.includes("video-gallery");
  return (
    <>
      <AuthProvider>
        {isAuthPath ? (
          // <AppRoutes>
          //   <Blank />
          // </AppRoutes>
          <Blank>
            <AppRoutes />
          </Blank>
        ) : (
          <Layout>
            <AppRoutes />
          </Layout>
        )}
      </AuthProvider>
    </>
  );
}

export default App;
