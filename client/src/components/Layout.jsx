import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from './Navbar.jsx';
import ServiceBar from './ServiceBar.jsx'
const Layout = ({children}) => {
    const location = useLocation();
    const isAuthPage = location.pathname === "/auth";
  return (
    <div className="app flex flex-col w-screen gap-1 bg-[#0a2532]">
      {!isAuthPage && <Navbar />} 
      <div className="flex">
        {!isAuthPage && <ServiceBar />} 
        {children}
      </div>
      <ToastContainer />
    </div>
  );
}

export default Layout