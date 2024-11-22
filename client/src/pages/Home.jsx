import React, { useRef, useState, useEffect } from "react";

import Conversations from "../components/Conversations.jsx";
import ChatBox from "../components/ChatBox.jsx";
import UserSearchModal from "../components/UserSearchModal.jsx";
import CreateChatModal from "../components/CreateChatModal.jsx";
import CreateChannelModal from "../components/CreateChannelModal.jsx";

import { io } from "socket.io-client";
import { userChats, createChat } from "../api/ChatApi.js";
import { useSelector } from "react-redux";
import { AiOutlinePlus } from "react-icons/ai";
import "../styles/Home.css";

const Home = () => {
  const [chats, setChats] = useState([]);
  const [chatData, setchatData] = useState({
    currentUserId: null,
    userIds: [],
    chatType: "",
    name: "",
    description: "",
    visibility: "",
    scope: "",
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [sendMessage, setSendMessage] = useState(null);
  const [receivedMessage, setReceivedMessage] = useState(null);
  const [createChatModalOpened, setCreateChatModalOpened] = useState(false);
  const [userSearchModal, setUserSearchModal] = useState(false);
  const [createChannelModal, setcreateChannelModal] = useState(false);
  const [selectedUsers, setselectedUsers] = useState([]);
  const [createChatSelection, setcreateChatSelection] = useState("");

  const user = useSelector((state) => state.user.authUser);
  const chatType = useSelector((state) => state.selection.selection);
  const socket = useRef();

  // Get the all chats of user
  useEffect(() => {
    const getChats = async () => {
      try {
        const response = await userChats(user.id, chatType);

        setChats(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    getChats();
  }, [chatType, chatData]);

  // Connect to Socket.io
  useEffect(() => {
    socket.current = io("http://localhost:8800");
    socket.current.emit("new-user-add", user.id);
    socket.current.on("get-users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.current.disconnect();
    };
  }, [user]);

  // Send Message to socket server
  useEffect(() => {
    if (sendMessage !== null) {
      socket.current.emit("send-message", sendMessage);
    }
  }, [sendMessage]);

  // Get the message from socket server
  useEffect(() => {
    socket.current.on("recieve-message", (data) => {
      setReceivedMessage(data);
    });
  }, []);

  //creating new chat
  const handleCreateChat = async (groupName) => {
    try {
      const userIds = selectedUsers.map((user) => user.id);
      const data = {
        currentUserId: user.id,
        userIds: userIds,
        chatType: createChatSelection,
        name: chatData.name,
        description: chatData.description,
        visibility: chatData.visibility,
        scope: chatData.scope,
      };

      const response = await createChat(data);

      setChats((prev) => [...prev, response.data.newChat]);
      setCurrentChat(response.data.newChat);
      setUserSearchModal(false);
      setselectedUsers([]);
      setchatData((prev) => {
        return {
          ...prev,
          name: "",
          scope: "",
          visibility: "",
          description: "",
        };
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="outer-container flex w-full">
      <div className="flex flex-col items-center relative w-56 pt-4 gap-4 bg-blue-900">
        <section className="flex justify-center items-center p-2 gap-6">
          <span className="text-base text-white">Conversations </span>
          <div
            className="flex justify-center items-center w-4 rounded-full cursor-pointer hover:bg-gray-400  bg-slate-50"
            onClick={() => setCreateChatModalOpened((prev) => !prev)}
          >
            <AiOutlinePlus size={17} />
          </div>
          {createChatModalOpened && (
            <CreateChatModal
              setCreateChatModalOpened={setCreateChatModalOpened}
              setUserSearchModal={setUserSearchModal}
              createChatSelection={createChatSelection}
              setcreateChatSelection={setcreateChatSelection}
              setcreateChannelModal={setcreateChannelModal}
            />
          )}
        </section>

        {userSearchModal && (
          <UserSearchModal
            selectedUsers={selectedUsers}
            setselectedUsers={setselectedUsers}
            setUserSearchModal={setUserSearchModal}
            setCurrentChat={setCurrentChat}
            createChatSelection={createChatSelection}
            handleCreateChat={handleCreateChat}
            setchatData={setchatData}
          />
        )}

        {createChannelModal && (
          <CreateChannelModal
            setcreateChannelModal={setcreateChannelModal}
            selectedUsers={selectedUsers}
            setselectedUsers={setselectedUsers}
            chatData={chatData}
            setchatData={setchatData}
            handleCreateChat={handleCreateChat}
          />
        )}

        {chats?.map((chat) => {
          return (
            <Conversations
              key={chat?.chat_id}
              chat={chat}
              currentUser={user}
              onlineUsers={onlineUsers}
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
            />
          );
        })}
      </div>
      {currentChat && (
        <ChatBox
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          setChats={setChats}
          chatType={chatType}
          setSendMessage={setSendMessage}
          receivedMessage={receivedMessage}
          onlineUsers={onlineUsers}
        />
      )}
      
    </div>
  );
};

export default Home;