import React, { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CgMailForward } from "react-icons/cg";
import { BiMessageAltDetail } from "react-icons/bi";
import { TfiMore } from "react-icons/tfi";
import { useSelector, useDispatch } from "react-redux";

import { updateReactions } from '../../../api/messageApi.js'
import { useSocket } from '../../../context/SocketContext.js'


const MessageActionModal = ({
  isCurrentUser,
  setreplyThread,
  message,
  socket,
  setMessages,
  setExpandedThreadHead,
}) => {
  const [moreActions, setMoreActions] = useState(false);
  const [position, setPosition] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [popularEmojis, setPopularEmojis] = useState(["😂", "❤️", "👍", "🔥"]);
  const [newReactionData, setNewReactionData] = useState(null);

  const parentRef = useRef(null);

  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.user.authUser);
  const permissions = useSelector(state => state.chats.chatPermissions)
  const currentUserRole = useSelector(state => state.chats.currentUserRole)
  const chatMembers = useSelector(state => state.chats.chatMembers)
  const currentChat = useSelector(state => state.chats.currentChat)

  const messageToThread = () => {
    const userPermissions = permissions[currentUserRole] || [];
    console.log(currentUserRole)
    if (currentChat.Chat.chat_type === 'channel' && !userPermissions.includes("reply in thread")) {
      toast.error("You do not have permission to reply in a thread.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
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

  const handleEmojiReactionClick = async (emojiData) => {
    const selectedReaction = emojiData.emoji;

    setEmojiPickerOpen(false)

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === message.id) {
          return {
            ...msg,
            MessageReactions: [
              ...(msg.MessageReactions || []).filter(
                (reaction) => reaction.userId !== currentUser.id
              ),
              { userId: currentUser.id, reaction: selectedReaction },
            ],
          };
        }
        return msg;
      })
    );
    const recipientsIds = chatMembers.map(member => member.user_id)
    setNewReactionData({ messageId: message.id, reaction: selectedReaction, userId: currentUser.id, username: currentUser.username, recipients: recipientsIds });
    try {
      console.log(message.id + ' ' + selectedReaction + ' ' + currentUser.id)
      await updateReactions(message.id, selectedReaction, currentUser.id);
      updatePopularEmojis(selectedReaction);
    } catch (error) {
      console.error("Failed to update reaction:", error);
      toast.error("Failed to update reaction. Please try again.");
    }
  }

  const handlePinMessageClick = () => {
    dispatch({ type: "PIN_MESSAGE", payload: message })
  }

  const updatePopularEmojis = (emoji) => {
    setPopularEmojis((prev) => {
      const emojiCounts = prev.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + (e === emoji ? 1 : 0);
        return acc;
      }, {});

      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;

      return Object.entries(emojiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([e]) => e);
    });
  };

  useEffect(() => {
    if (newReactionData) {
      console.log(socket)
      socket.current.emit("send-reaction", newReactionData);
      setNewReactionData(null);
    }
  }, [newReactionData]);

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
        className={`actions absolute flex items-center justify-around gap-2 bg-white shadow-lg bottom-[90%] ${isCurrentUser ? "right-0" : "left-0"
          } w-auto h-6 z-10`}
      >
        <div
          className="flex items-center justify-center w-6 h-6 hover:bg-blue-100 hover:text-blue-400 cursor-pointer"
        >
          <BsEmojiSmile
            size={13}
            className="cursor-pointer"
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
          />
          <div className={`emojipicker absolute right-0 ${position === 'above' ? 'bottom-7' : 'top-7'} ${isCurrentUser ? "right-0" : "left-0"
            } z-20`}>
            <EmojiPicker
              open={emojiPickerOpen}
              onEmojiClick={handleEmojiReactionClick}
              width={290}
              height={300}
              emojiStyle={EmojiStyle.GOOGLE}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </div>
        <div className="w-[1px] bg-gray-400 h-4/6 rounded-sm"></div>

        <div className="popular-emojis flex gap-2">
          {popularEmojis.map((emoji, idx) => (
            <span
              key={idx}
              className="cursor-pointer text-lg hover:bg-gray-200 p-1"
              onClick={() => handleEmojiReactionClick(emoji)}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="forward flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer"
        >
          <CgMailForward />
        </div>
        <div className="w-[1px] bg-gray-400 h-4/6 rounded-sm"></div>

        <div className="w-[1px] bg-gray-400 h-4/6 rounded-sm"></div>
        {!message.thread_id && message.sender_id !== currentUser.id && (
          <div className="replyinthread flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer">
            <BiMessageAltDetail onClick={messageToThread} />
          </div>
        )}
        <div className="w-[1px] bg-gray-400 h-4/6 rounded-sm"></div>
        <div
          className="more flex items-center justify-center w-6 h-full hover:bg-blue-100 hover:text-blue-400 cursor-pointer"
          onClick={() => setMoreActions((prev) => !prev)}
        >
          <TfiMore />
        </div>
      </div>
      {moreActions && (
        <div
          className={`absolute w-32 h-24 ${position === "below"
            ? "top-3"
            : position === "middle"
              ? "top-3 "
              : "bottom-[115%]"
            } bg-white shadow-lg 
          ${isCurrentUser ? "right-0" : "left-0"} z-20`}
        >
          <section className="m-2">
            <div className="forward hover:bg-blue-100 cursor-pointer hover:text-blue-400 rounded-sm">
              <span className="p-2" onClick={() => {
                dispatch({ type: "OPEN_FORWARD_MESSAGE_MODAL" })
                dispatch({ type: "SET_FORWARDED_MESSAGE", payload: message })
              }}>Forward</span>
            </div>
            <div className="copylink hover:bg-blue-100 hover:text-blue-400 rounded-sm cursor-pointer">
              <span className="p-2">Copy Link</span>
            </div>
            <div className="pin hover:bg-blue-100 hover:text-blue-400 rounded-sm cursor-pointer" onClick={handlePinMessageClick}>
              <span className="p-2">Pin</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default MessageActionModal;
