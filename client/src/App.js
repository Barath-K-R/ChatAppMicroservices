import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ServiceBar from "./components/ServiceBar";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
function App() {
  const user=useSelector(state=>state.user.authUser)
  console.log(user)
  return (
    <>
      <Navbar />
      <div className="flex">
        <ServiceBar />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Home /> : <Auth />} />
            <Route path="/auth" element={user ? <Home /> : <Auth />} />
          </Routes>
        </BrowserRouter>
      </div>
      <ToastContainer />

    </>
  );
}

export default App;
