import React, { useEffect, useState, useRef } from "react";
import { CiUser } from "react-icons/ci";
import { CgLaptop, CgMailReply } from "react-icons/cg";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Message from "./Message.jsx";
import MembersList from "./MembersList.jsx";
import ChatSettings from "./ChatSettings.jsx";
import ChatInfo from "./ChatInfo.jsx";

import {
  retrieveMembers,
  getRolePermissions,
} from "../api/ChatApi";
import {getMessages,addMessage,addReadReciept,updateReadReciepts} from '../api/messageApi.js'
import { addMessageToThread,createThread} from "../api/threadApi.js";
const ChatBox = ({
  chat,
  setChats,
  setCurrentChat,
  chatType,
  setSendMessage,
  receivedMessage,
  onlineUsers,
}) => {
  const [isGroup, setIsGroup] = useState(false);
  const [emojiPickerOpen, setemojiPickerOpen] = useState(false);
  const [chatMembers, setchatMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [messageActionIndex, setmessageActionIndex] = useState(null);
  const [currentThreadMessages, setcurrentThreadMessages] = useState([]);
  const [expandedThreadHead, setExpandedThreadHead] = useState(null);
  const [threadMap, setThreadMap] = useState({});
  const [replyThread, setreplyThread] = useState("");
  const [membersListModalOpened, setmembersListModalOpened] = useState(false);
  const [chatSettingsOpened, setchatSettingsOpened] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentUserChatDetails, setcurrentUserChatDetails] = useState(null);
  const [chatInfoModalOpened, setchatInfoModalOpened] = useState(false);

  const messagesEndRef = useRef(null);

  const currentUser = useSelector((state) => state.user.authUser);

  const buildThreadMap = () => {
    const newThreadMap = {};
    const threadMessageIds = {};

    messages.forEach((message) => {
      if (message.thread_id) {
        if (!newThreadMap.hasOwnProperty(message.thread_id)) {
          newThreadMap[message.thread_id] = [];
          threadMessageIds[message.thread_id] = new Set();
        }

        if (
          !threadMessageIds[message.thread_id]?.has(message.id) &&
          message.is_thread_head === false
        ) {
          newThreadMap[message.thread_id].push(message);
          threadMessageIds[message.thread_id]?.add(message.id);
        }
      }
    });
    setThreadMap(newThreadMap);
  };

  const handleReplyChange = (e) => {
    setReplyMessage(e.target.value);
  };

  const handleEmojiClick = (emojiData) => {
    if (emojiData.emoji) {
      setNewMessage((prev) => prev + emojiData.emoji);
    }
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
  };

  const updateExpandThreadHead = (mssg) => {
    if (mssg.id !== expandedThreadHead?.id) setExpandedThreadHead(mssg);
    else {
      setreplyThread("");
      setExpandedThreadHead(null);
      setcurrentThreadMessages([]);
    }
  };
  //handling threadClick
  const updateCurrentMessages = (mssg) => {
    setcurrentThreadMessages(
      messages.filter((message) => {
        if (message.thread_id === mssg.thread_id && !message.is_thread_head)
          return message;
      })
    );
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
    buildThreadMap();
  }, [messages]);

  //checking chat is group or direct,fetching messages,fetching chat Members,fetching role permissions
  useEffect(() => {
    const checkIfGroup = () => {
      if (chat?.Chat?.name) setIsGroup(true);
      else setIsGroup(false);
    };

    const getChatMembers = async () => {
      try {
        const response = await retrieveMembers(chat?.chat_id);
        setchatMembers(response.data);
      } catch (error) {
        console.log("Error fetching chat members:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        console.log(chat?.chat_id);
        
        const { data } = await getMessages(chat?.chat_id);
        console.log(data)
        setMessages(data);

        const unseenMessages = data
          .filter((message) => {
            if (
              message?.ReadReciepts?.length > 0 &&
              message?.ReadReciepts[0]?.seen_at === null &&
              message.sender_id !== currentUser.id
            )
              return message;
          })
          .map((message) => message.id);

        if (unseenMessages.length > 0) {
          const updatedReadRecieptsResponse = await updateReadReciepts({
            messageIds: unseenMessages,
            userId: currentUser.id,
            date: Date.now(),
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (chat !== null) {
      checkIfGroup();
      getChatMembers();
      fetchMessages();
    }
  }, [chat]);

  //fetching rolepermissions
  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const currentUserDetails = chatMembers.find(
          (member) => member.user_id === currentUser.id
        );

        const response = await getRolePermissions(
          chat.chat_id,
          currentUserDetails.role_id
        );
        console.log(response.data);
        setUserPermissions(response.data);
      } catch (error) {
        console.log(error);
        
      }
    };
    chatMembers.forEach((member) => {
      if (member.user_id === currentUser.id) setcurrentUserChatDetails(member);
    });
    fetchRolePermissions();
  }, [chatMembers]);

  //handling sent messages
  const handleSend = async (e) => {
    let hasSendMessagePermission = null;
    if (currentUserChatDetails.Role.name === "admin") {
      hasSendMessagePermission = true;
    } else {
      hasSendMessagePermission = userPermissions?.some(
        permission=> permission.Permission.name === "send message"
      );
    }

    if (!hasSendMessagePermission) {
      toast.error("You do not have permission to send a message!", {
        position: "top-right",
      });
      return;
    }

    let threadId = null;

    if (replyThread === "new") {
      threadId = uuidv4();

      setExpandedThreadHead((prev) => {
        return { ...prev, thread_id: threadId };
      });
    }

    setemojiPickerOpen(false);

    const userIds = chatMembers
      .filter((user) => user.user_id !== currentUser.id)
      .map((user) => user.user_id);

    const createdAt = Date.now();

    const newMessageData = {
      createdAt: createdAt,
      ReadReciepts: [
        {
          seen_at: onlineUsers.some((user) => user.userId === userIds[0])
            ? createdAt
            : null,
        },
      ],
      // username: currentUser.username,
      user: { username: currentUser.username },
      sender_id: currentUser.id,
      message: replyThread !== "" ? replyMessage : newMessage,
      thread_id:
        replyThread === "old" ? expandedThreadHead.thread_id : threadId,
      chatId: chat?.chat_id,
      chatType: chatType,
      is_thread_head: false,
    };

    //updating the messages
    setMessages((prev) => [...prev, newMessageData]);

    //updating currentThreadMessages if it is reply to thread
    if (replyThread !== "") {
      setcurrentThreadMessages((prev) => [...prev, newMessageData]);
    }

    // send message to socket server
    setSendMessage({ ...newMessageData, userIds });

    // send message to backend
    try {
      let newMessageResponse = null;
      if (replyThread === "")
        newMessageResponse = await addMessage(newMessageData);
      else if (replyThread === "old") {

        console.log('old thread');
        newMessageResponse = await addMessageToThread(newMessageData);
      } else {
        
        console.log('new thread');
        newMessageResponse = await createThread({
          ...newMessageData,
          head: expandedThreadHead.id,
          userIds: [expandedThreadHead.sender_id, currentUser.id],
        });
        //changing the temporary thread_id with new Thread_id
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.thread_id === threadId
              ? { ...message, thread_id: newMessageResponse.thread_id }
              : message
          )
        );
      }

      //creating read reciepts
      const readRecieptResponse = await addReadReciept(
        {
          userIds: userIds,
          date: onlineUsers.some((user) => user.userId === userIds[0])
            ? createdAt
            : null,
        },
        newMessageResponse.data.id
      );

      //resetting all newmessages
      setNewMessage("");
      setReplyMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  // Receive Message from parent component
  useEffect(() => {
    if (receivedMessage && receivedMessage.chatId === chat?.chat_id) {
      setMessages((prev) => [...prev, receivedMessage]);
      if (
        receivedMessage?.thread_id &&
        expandedThreadHead?.thread_id &&
        receivedMessage.thread_id === expandedThreadHead.thread_id
      )
        setcurrentThreadMessages((prev) => [...prev, receivedMessage]);
    }
  }, [receivedMessage]);

  const convertDateTime = (dateStr) => {
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
  return (
    <div className="flex flex-col relative h-screen w-full bg-slate-100 z-0">
      {/* Chat header */}
      <div className="flex relative items-center justify-between h-12 border border-solid border-gray-500 shadow-sm bg-white p-4 px-6 gap-6">
        <section className="flex items-center gap-6">
          <div className="flex justify-start items-center max-w-max h-10 cursor-pointer">
            <h1 className="font-semibold text-xl ">
              {chat?.Chat?.name ? chat.Chat?.name : chat?.User?.username}
            </h1>
          </div>
          <div
            className="flex justify-center items-center cursor-pointer"
            onClick={() => setmembersListModalOpened((prev) => !prev)}
          >
            <CiUser size={22} />
            <span>{chatMembers.length}</span>
          </div>
        </section>

        <div
          className="dots flex justify-center items-center w-6 h-6  hover:bg-gray-100 rounded-xl"
          onClick={() => setchatSettingsOpened((prev) => !prev)}
        >
          <BsThreeDotsVertical className="cursor-pointer" />
        </div>
        {chatSettingsOpened && (
          <ChatSettings
            chat={chat}
            currentUser={currentUser}
            setchatSettingsOpened={setchatSettingsOpened}
            setchatInfoModalOpened={setchatInfoModalOpened}
          />
        )}
      </div>

      {/* chat info */}
      {chatInfoModalOpened && (
        <ChatInfo
          currentChat={chat}
          setChats={setChats}
          setCurrentChat={setCurrentChat}
          setMessages={setMessages}
          setchatInfoModalOpened={setchatInfoModalOpened}
        />
      )}

      {/* members list */}
      {membersListModalOpened && (
        <MembersList
          chat={chat}
          chatMembers={chatMembers}
          setchatMembers={setchatMembers}
          setmembersListModalOpened={setmembersListModalOpened}
          userPermissions={userPermissions}
        />
      )}

      {/* Scrollable message display */}
      <div className="flex-1 flex flex-col gap-2 bg-white p-2 pt-8 overflow-scroll">
        {messages.map((message, index) => {
          return (
            <div
              className={`message flex flex-col hover:bg-gray-100 ${
                message.is_thread_head &&
                "border border-gray-300 shadow-lg rounded-lg cursor-pointer"
              }`}
            >
              {(message.is_thread_head || !message.thread_id) && (
                <Message
                  index={index}
                  message={message}
                  setMessages={setMessages}
                  currentUser={currentUser}
                  isGroup={isGroup}
                  setreplyThread={setreplyThread}
                  setExpandedThreadHead={setExpandedThreadHead}
                  messageActionIndex={messageActionIndex}
                  setmessageActionIndex={setmessageActionIndex}
                  currentThreadMessages={currentThreadMessages}
                  onThreadClick={() => {
                    if (message.is_thread_head) {
                      updateExpandThreadHead(message);
                      updateCurrentMessages(message);
                    }
                  }}
                />
              )}

              {message.is_thread_head &&
                expandedThreadHead?.id === message.id && (
                  <div className="flex flex-col m-2 mt-2">
                    {currentThreadMessages.map((threadMessage) => (
                      <Message
                        key={threadMessage.id}
                        message={threadMessage}
                        currentUser={currentUser}
                        isGroup={isGroup}
                        expandedThreadHead={expandedThreadHead}
                        messageActionIndex={messageActionIndex}
                        setmessageActionIndex={setmessageActionIndex}
                      />
                    ))}
                  </div>
                )}
              {message.is_thread_head &&
                expandedThreadHead?.id === message.id &&
                replyThread !== "" && (
                  <div className="border bottom-0 flex justify-evenly items-center focus:border-none focus:outline-none w-full h-18 bg-white p-4">
                    <input
                      type="text"
                      className="h-8 w-10/12 rounded-md border border-blue-400 focus:outline-none p-2"
                      value={replyMessage}
                      onChange={handleReplyChange}
                    />
                    <button
                      className="h-7 w-14 bg-blue-500 hover:bg-blue-600 rounded-md"
                      onClick={handleSend}
                    >
                      Send
                    </button>
                  </div>
                )}

              {message.is_thread_head && (
                <>
                  <div className="line w-full h-[1px] bg-gray-200 block"></div>
                  <div className="replies flex justify-between items-center px-2 bg-white w-full h-6 text-sm ">
                    <span className="text-blue-400">
                      {threadMap[message.thread_id]?.length} Replies
                    </span>
                    <section className="flex gap-2 justify-evenly">
                      <CgMailReply
                        size={17}
                        className="hover:text-blue-400 cursor-pointer"
                        onClick={() => setreplyThread("old")}
                      />
                      <CiUser className="hover:text-blue-400 cursor-pointer" />
                    </section>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {/* Scroll to bottom reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed message input */}
      <div className="sticky border bottom-0 flex justify-evenly items-center focus:border-none focus:outline-none w-full h-18 bg-white p-4">
        <input
          type="text"
          className="h-8 w-10/12 rounded-md border border-blue-400 focus:outline-none p-2"
          value={newMessage}
          onChange={handleChange}
        />
        <BsEmojiSmile
          size={20}
          className="cursor-pointer"
          onClick={() => setemojiPickerOpen((prev) => !prev)}
        />
        <div className="emojipicker absolute bottom-16 right-10">
          <EmojiPicker
            open={emojiPickerOpen}
            onEmojiClick={handleEmojiClick}
            width={290}
            height={300}
            emojiStyle={EmojiStyle.GOOGLE}
            previewConfig={{ showPreview: false }}
          />
        </div>

        <button
          className="h-7 w-14 bg-blue-500 hover:bg-blue-600 rounded-md"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;