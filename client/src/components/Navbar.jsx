import React from "react";
import { useSelector } from "react-redux";
import { AiOutlineMessage } from "react-icons/ai";

import useLogout from "../hooks/useLogout.js";
const Navbar = () => {
  const currentUser = useSelector((state) => state.user.authUser);
  const logout = useLogout();

  return (
    <div className="flex justify-between w-full h-14 p-2 bg-[#0a3244] items-center text-white">
      <div className="flex items-center gap-2 ml-4 text-xl">
        <AiOutlineMessage size={25} />
        <h2>Chat App</h2>
      </div>
      <div className="profile flex items-center justify-center gap-2">
        <span className="cursor-pointer" onClick={logout}>
          Logout
        </span>
        <div className="round flex justify-center items-center w-6 h-6 text-xl text-black rounded-2xl bg-gray-100">
          {currentUser?.username?.charAt(0).toUpperCase()}
        </div>
        <span>{currentUser?.username}</span>
      </div>
    </div>
  );
};

export default Navbar;
