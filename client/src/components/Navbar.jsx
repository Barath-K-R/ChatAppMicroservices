import React from "react";
import { useSelector } from "react-redux";
import { BsMessenger } from "react-icons/bs";

import useLogout from "../hooks/useLogout.js";
const Navbar = () => {
  const currentUser = useSelector((state) => state.user.authUser);
  const logout = useLogout();

  return (
    <div className="flex justify-between w-screen h-10 pr-6 bg-blue-600">
      <div className="flex items-center gap-2 ml-4">
        <BsMessenger size={22} />
        <h2>Cliq</h2>
      </div>
      <div className="profile flex items-center justify-center gap-2">
        <span className="cursor-pointer" onClick={logout}>
          Logout
        </span>
        <div className="round flex justify-center items-center w-6 h-6 text-xl rounded-2xl bg-gray-100">
          {currentUser?.username?.charAt(0).toUpperCase()}
        </div>
        <span>{currentUser?.username}</span>
      </div>
    </div>
  );
};

export default Navbar;
