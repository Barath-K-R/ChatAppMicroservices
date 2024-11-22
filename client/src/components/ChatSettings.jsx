import React from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { leaveChat } from "../api/ChatApi.js";
const ChatSettings = ({
  chat,
  currentUser,
  setchatSettingsOpened,
  setchatInfoModalOpened,
}) => {
  
  const handleLeave=async()=>{
      try {
        const leaveChatResponse=await leaveChat(chat.chat_id,currentUser.id)
        toast.success("You have successfully left the chat.",{
            position:'top-right'
          });
        
      } catch (error) {
        console.error("Error while leaving the chat:", error);
        toast.error("Failed to leave the chat. Please try again.");
      }
  }
  return (
    <div
      className="absolute w-28 right-8 top-6 p-2 shadow-md bg-white"
      onMouseLeave={() => setchatSettingsOpened(false)}
    >
      <ul className="space-y-2">
        <li
          className="hover:bg-gray-100 px-2 cursor-pointer"
          onClick={() => setchatInfoModalOpened(true)}
        >
          chat info
        </li>
        <li
          className="hover:bg-gray-100 px-2 text-red-500 cursor-pointer"
          onClick={handleLeave}
        >
          Leave
        </li>
      </ul>
    </div>
  );
};

export default ChatSettings;