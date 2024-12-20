import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home/Home.jsx";
import ServiceBar from "./components/ServiceBar";
import OrganizationChoice from "./pages/organization/OrganizationChoice.jsx";
import Auth from "./pages/auth/Auth.jsx";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const user = useSelector(state => state.user.authUser);
  const organizationId = user ? user.organization_id : null;
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app flex flex-col w-full h-screen gap-[2px] bg-[#0a2532]">

        {user && organizationId && <Navbar />}
        <div className="flex h-full">
          {user && organizationId && <ServiceBar />}
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    organizationId ? (
                      <Home />
                    ) : (
                      <OrganizationChoice />
                    )
                  ) : (
                    <Auth />
                  )
                }
              />
              <Route
                path="/auth"
                element={user ? <Home /> : <Auth />}
              />
            </Routes>
          </BrowserRouter>
        </div>
        <ToastContainer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
