import React, { useState, useRef, useEffect } from "react";
import { createThread } from "../api/ChatApi.js";

import { CgMailForward } from "react-icons/cg";
import { BiMessageAltDetail } from "react-icons/bi";
import { TfiMore } from "react-icons/tfi";
import { useSelector } from "react-redux";

const MessageActionModal = ({
  isCurrentUser,
  setreplyThread,
  message,
  setMessages,
  setExpandedThreadHead,
}) => {
  const [moreActions, setMoreActions] = useState(false);
  const [position, setPosition] = useState("");
  const parentRef = useRef(null);

  const currentUser = useSelector((state) => state.user.authUser);

  //converting normal message to threadhead
  const messageToThread = () => {
    setExpandedThreadHead(message);
    setreplyThread("new");
    setMessages((prev) => {
      return prev.map((msg) => {
        if (msg.id === message.id) {
          return { ...msg, is_thread_head: true };
        }
        return msg;
      });
    });
  };

  useEffect(() => {
    if (parentRef.current) {
      const parentPosition = parentRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const middleScreen = screenHeight / 2;

      if (parentPosition.top < middleScreen / 2) {
        setPosition("below");
      } else if (parentPosition.top < middleScreen) {
        setPosition("middle");
      } else {
        setPosition("above");
      }
    }
  }, [moreActions]);

  return (
    <>
      <div
        ref={parentRef}
        className={`actions absolute flex items-center justify-around gap-2 bg-white shadow-lg bottom-[90%] ${
          isCurrentUser ? "right-0" : "left-0"
        } w-auto h-6 z-10`}
      >
        <div className="reaction"></div>
        <div className="w-[1px] bg-gray-400 h-4/6 rounded-sm"></div>
        <div className="forward flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer">
          <CgMailForward />
        </div>
        {!message.thread_id && message.sender_id !== currentUser.id && (
          <div className="replyinthread flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer">
            <BiMessageAltDetail onClick={messageToThread} />
          </div>
        )}

        <div
          className="more flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer"
          onClick={() => setMoreActions((prev) => !prev)}
        >
          <TfiMore />
        </div>
      </div>
      {moreActions && (
        <div
          className={`absolute w-32 h-24 ${
            position === "below"
              ? "top-3"
              : position === "middle"
              ? "top-3 "
              : "bottom-[120%]"
          } bg-white shadow-lg 
          ${isCurrentUser ? "right-0" : "left-0"} z-20`}
        >
          <section className="m-2">
            <div className="forward hover:bg-blue-100 cursor-pointer hover:text-blue-400 rounded-sm">
              <span className="p-2">Forward</span>
            </div>
            <div className="copylink hover:bg-blue-100 hover:text-blue-400 rounded-sm cursor-pointer">
              <span className="p-2">Copy Link</span>
            </div>
            <div className="pin hover:bg-blue-100 hover:text-blue-400 rounded-sm cursor-pointer">
              <span className="p-2">Pin</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default MessageActionModal;
