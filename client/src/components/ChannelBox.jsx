import React, { useEffect, useState } from "react";
import { getUser } from "../api/UserApi";
import { getMessages, addMessage } from "../api/ChatApi";
const ChannelBox = ({ chat, currentUser, setSendMessage, receivedMessage }) => {
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleChange = (e) => {
    setNewMessage(e.target.value);
  };

  // fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getMessages(chat.chat_id);
        console.log(data);
        setMessages(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (chat !== null) fetchMessages();
  }, [chat]);

  const handleSend = async (e) => {
    
    e.preventDefault();
    const message = {
      senderId: currentUser,
      text: newMessage,
      chatId: chat.chat_id,
    };
    const receiverId = chat?.user_id;

    // send message to socket server
    setSendMessage({ ...message, receiverId });

    // send message to database
    try {
      const { data } = await addMessage(message);
      console.log(data)
      setMessages([...messages, data]);
      setNewMessage("");
    } catch {
      console.log("error");
    }
  };

  // Receive Message from parent component
  useEffect(() => {
    console.log("Message Arrived: ", receivedMessage);
    if (receivedMessage !== null && receivedMessage.chatId === chat?.chat_id) {
      setMessages([...messages, receivedMessage]);
    }
  }, [receivedMessage]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-100">
      <div className="flex-10 flex items-center h-12 border border-solid border-gray-500 shadow-2xl bg-white p-4">
        <h1>{chat?.username}</h1>
      </div>
      <div className="flex-1 flex flex-col gap-4 bg-white p-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender_id === currentUser;
          return (
            <div
              key={index}
              className={`inline-block max-w-max p-2 rounded-lg ${
                isCurrentUser
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-200 text-black self-start"
              }`}
            >
              <p>{message.text}</p>
            </div>
          );
        })}
      </div>
      <div className="flex-10 flex h-12 bg-green-400 border border-gray-400 p-4">
        <input
          type="text"
          className="h-6 w-5/6 rounded-xl"
          onChange={handleChange}
        />
        <button
          className="h-7 w-14 bg-blue-500 rounded-md"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChannelBox;
