import React, { useState } from "react";
import { FiEye } from "react-icons/fi";
import { CgMailForward } from "react-icons/cg";
import { useSelector } from "react-redux";

import MessageActionModal from "./MessageActionModal.jsx";
import MessageReactionModal from "./MessageReactionModal.jsx";

const Message = ({
  index,
  isGroup,
  setmessageActionIndex,
  messageActionIndex,
  message,
  socket,
  setActiveMessageId,
  setExpandedThreadHead,
  expandedThreadHead,
  setMessages,
  setreplyThread,
  onThreadClick
}) => {

  const [selectedMessageForReactions, setSelectedMessageForReactions] = useState(null);
  const currentUser = useSelector((state) => state?.user?.authUser);

  const isCurrentUser = message.sender_id === currentUser.id;

  const convertTime = (dateStr) => {
    const date = new Date(dateStr);

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const minutesStr = minutes < 10 ? "0" + minutes : minutes;

    const timeString = `${hours}:${minutesStr} ${ampm}`;
    return timeString;
  };

  const convertDate = (dateStr) => {
    const date = new Date(dateStr);
  
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  
    const day = date.getDate();
  
    return `${month} , ${day}`;
  };
  return (
    <>
      {(message.is_thread_head ||
        message.thread_id === null ||
        expandedThreadHead?.thread_id === message.thread_id) && (
          <div
            key={index}
            className={`message flex flex-col relative inline-block max-w-max p-2 px-4 gap-2 bg-gray-100 rounded-lg ${isCurrentUser ? " self-end items-end" : "self-start items-start"
              }`}
            onMouseOver={() => setmessageActionIndex(index)}
            onMouseLeave={() => setmessageActionIndex(null)}
            onClick={onThreadClick}
          >
            {messageActionIndex === index && (
              <MessageActionModal
                isCurrentUser={isCurrentUser}
                message={message}
                socket={socket}
                setMessages={setMessages}
                setExpandedThreadHead={setExpandedThreadHead}
                setreplyThread={setreplyThread}
              />
            )}

            <section
              className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"
                } gap-2`}
            >
              
                <span className="font-bold">
                {isGroup && message.sender_id !== currentUser.id
                  ? message?.User?.username
                  : "you"}
              </span>

              {message.isForwarded && <div className="forwardedmessage flex flex-col p-2 border border-l-blue-400 rounded-xl">
                <div className="profile flex items-center justify-around gap-2 font-bold">
                  <CgMailForward />
                  <span>{message?.forwardedMessage?.User?.username}</span>
                  <span className="font-normal text-xs">{convertDate(message?.forwardedMessage?.createdAt)} , {convertTime(message?.forwardedMessage?.createdAt)}</span>
                </div>
                <span>{message?.message}</span>
              </div>}

              {!message?.isForwarded && <p className="text-base">{message?.message}</p>}

              {/* timing */}
              <span className="text-xs">
                {convertTime(message?.createdAt)}
              </span>
              {/* seen or unseen */}
              {message?.ReadReciepts?.length === 1 &&
                message.ReadReciepts[0].seen_at &&
                message.sender_id === currentUser.id && <FiEye size={10} />}
            </section>

            {/* message Reactions */}
            {message?.MessageReactions?.length > 0 && (
              <div className={`bg-white w-max h-auto rounded-xl px-2 py-1 flex gap-2 items-center shadow-lg cursor-pointer`}
                onClick={() => setSelectedMessageForReactions(message)}
              >
                {message?.MessageReactions?.slice(0, 3).map((reaction, index) => (
                  <span key={index} className="text-sm">
                    {reaction.reaction}
                  </span>
                ))}
                {message?.MessageReactions?.length > 3 && (
                  <span
                    className="text-blue-500 text-sm cursor-pointer"
                  >
                    ...
                  </span>
                )}
              </div>
            )}

            {selectedMessageForReactions && (
              <MessageReactionModal
                message={selectedMessageForReactions}
                onClose={() => setSelectedMessageForReactions(null)}
              />
            )}
          </div>
        )}
    </>
  );
};

export default Message;
