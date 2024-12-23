import React, { useEffect, useState, useRef } from "react";
import { CiUser } from "react-icons/ci";
import { BiMessageAltAdd } from "react-icons/bi";
import { CgLaptop, CgMailReply } from "react-icons/cg";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";
import { BsThreeDotsVertical } from "react-icons/bs";

import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Message from "./Message.jsx";
import MembersList from "./MembersList.jsx";
import ChatSettings from "./ChatSettings.jsx";
import ChatInfo from "./ChatInfo.jsx";
import ForwardMessageModal from "./ForwardMessageModal.jsx";
import PinMessageModal from "./PinMessageModal.jsx";


import {
  retrieveMembers,
  getAllRolePermissions
} from "../../../api/ChatApi.js";
import { getMessages, addMessage, createReadReciept, updateReadReciepts } from '../../../api/messageApi.js'
import { addMessageToThread, createThread, getThreadMembers, addMembersToThread, getThreadByUser } from "../../../api/threadApi.js";
import GroupNameModal from "./GroupNameModal.jsx";
const ChatBox = ({
  chat,
  chats,
  socket,
  setChats,
  chatType,
  setSendMessage,
  receivedMessage,
  onlineUsers,
}) => {
  const [isGroup, setIsGroup] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [emojiPickerOpen, setemojiPickerOpen] = useState(false);
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
  const [chatInfoModalOpened, setchatInfoModalOpened] = useState(false);
  const [pinMessageModalOpen, setPinMessageModalOpen] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const userThreads = useRef([]);

  const dispatch = useDispatch()
  const chatMembers = useSelector(state => state.chats.chatMembers)
  const userPermissions = useSelector(state => state.chats.chatPermissions)
  const currentUser = useSelector(state => state.user.authUser);
  const permissions = useSelector(state => state.chats.chatPermissions)
  const currentUserRole = useSelector(state => state.chats.currentUserRole)
  const isForwardMessageModalOpened = useSelector(state => state.forwardMessage.isForwardMessageModalOpened)
  const forwardedMessage = useSelector(state => state.forwardMessage.forwardedMessage)
  const currentChat = useSelector(state => state.chats.currentChat)
  const pinnedMessages = useSelector(state => state.chats.pinnedMessages)

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


  useEffect(() => {
    if (expandedThreadHead?.thread_id) {
      setcurrentThreadMessages(
        messages.filter((message) => {
          return message.thread_id === expandedThreadHead?.thread_id && !message.is_thread_head;
        })
      );
    }
  }, [expandedThreadHead, messages]);


  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  //fetching chatpermissions 
  useEffect(() => {
    const fetchAllRolePermissions = async () => {
      if (!currentChat || !currentChat.chat_id || !chatMembers || !currentUser)
        return;


      try {

        const response = await getAllRolePermissions(currentChat.chat_id);
        const data = response.data;
        const permissionsByRole = {
          admin: [],
          moderator: [],
          member: [],
        };

        data.forEach((item) => {
          const role = item.role_name.toLowerCase();
          if (permissionsByRole[role]) {
            permissionsByRole[role].push(item.permission_name);
          }
        });


        dispatch({
          type: "SET_CHAT_PERMISSIONS",
          payload: permissionsByRole,
        });

        const currentUserRole = chatMembers.find(
          (member) => member.user_id === currentUser.id
        )?.Role.name;

        if (currentUserRole) {
          dispatch({
            type: "SET_CURRENT_USER_ROLE",
            payload: currentUserRole,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    if (currentChat.Chat.chat_type === 'channel')
      fetchAllRolePermissions();
  }, [currentChat, chatMembers]);


  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
    buildThreadMap();
  }, [messages]);

  //checking chat is group or direct
  useEffect(() => {
    if (currentChat !== null) {
      setIsGroup(!!currentChat?.Chat?.name);
    }
  }, [currentChat]);


  // Fetch chat members
  useEffect(() => {
    const getChatMembers = async () => {
      if (currentChat !== null) {
        try {
          const response = await retrieveMembers(currentChat?.chat_id);
          dispatch({ type: "SET_CHAT_MEMBERS", payload: response.data });
        } catch (error) {
          console.log("Error fetching chat members:", error);
        }
      }
    };
    getChatMembers();
  }, [currentChat]);

  // fetching chat Members,fetching role permissions
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getMessages(currentChat?.chat_id);
        setMessages(data);

        const unseenMessages = data
          .filter(
            (message) =>
              message?.ReadReciepts?.[0]?.seen_at === null &&
              message.sender_id !== currentUser.id
          )
          .map((message) => message.id);

        if (unseenMessages.length) {
          await updateReadReciepts({
            messageIds: unseenMessages,
            userId: currentUser.id,
            date: Date.now(),
          });
        }
      } catch (error) {
        toast.error("Failed to fetch messages. Please try again.");
        console.error("Fetch Messages Error:", error);
      }
    };

    fetchMessages();

  }, [currentChat]);

  //fetching all threads of currentuser
  useEffect(() => {
    const fetchAllThreadsOfUser=async()=>{
      const threads=await getThreadByUser(currentUser.id);
      userThreads.current=threads.data.map(thread=>thread.thread_id);
    }
    fetchAllThreadsOfUser();
  }, [currentChat])
  

  //handling sent messages
  const handleSend = async (e) => {

    if (currentChat.Chat.chat_type === 'channel' && !permissions[currentUserRole].includes("send message")) {
      toast.error("You do not have permission to send a message!", {
        position: "top-right",
      });
      return;
    }


    //preparing message to send
    let threadId = null;

    if (replyThread === "new") {
      threadId = uuidv4();
      setMessages(prev => prev.map(msg => msg.id === expandedThreadHead.id ? { ...msg, thread_id: threadId } : msg))
      setExpandedThreadHead((prev) => {
        return { ...prev, thread_id: threadId };
      });
    } else {
      threadId = expandedThreadHead?.thread_id;
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
      User: { username: currentUser.username },
      sender_id: currentUser.id,
      message: replyThread !== "" ? replyMessage : newMessage,
      thread_id:
        replyThread === "old" ? expandedThreadHead.thread_id : threadId,
      chatId: currentChat?.chat_id,
      chatType: chatType,
      is_thread_head: false,
      forwardedMessage: forwardedMessage && Object.keys(forwardedMessage).length > 0 ? forwardedMessage : null,
      isForwarded: forwardedMessage && Object.keys(forwardedMessage).length > 0,
    };


    //updating the messages
    setMessages((prev) => [...prev, newMessageData]);

    console.log('sedning head message to socket server')
    console.log(expandedThreadHead)
    // send message to socket server
    setSendMessage({ ...newMessageData, userIds, headMessage: { ...expandedThreadHead, thread_id: threadId } });

    // send message to backend
    try {
      let newMessageResponse = null;

      if (replyThread === "new") {

        newMessageResponse = await createThread({
          ...newMessageData,
          head: expandedThreadHead.id,
          userIds: [expandedThreadHead.sender_id, currentUser.id],
        });

        //changing the temporary thread_id with new Thread_id
        if (newMessageResponse && replyThread === 'new') {
          console.log('updating thread_id')
          setMessages((prevMessages) =>
            prevMessages.map((message) => {
              return message.thread_id === threadId
                ? { ...message, thread_id: newMessageResponse.data.newThread.id }
                : message
            })
          );
        }
        setExpandedThreadHead(prev => { return { ...prev, thread_id: newMessageResponse.data.newThread.id } })
      }
      else {
        newMessageResponse = await addMessage(newMessageData);
      }

      //creating read reciepts
      const readRecieptResponse = await createReadReciept(
        userIds,
        newMessageResponse.data.id
      );

      setNewMessage("");
      setReplyMessage("");
      setreplyThread("")
    } catch (error) {
      console.log(error);
    }
  };

  // Receive Message from socket server
  useEffect(() => {
    console.log('Received message', receivedMessage);

    if (receivedMessage) {
      const { headMessage, chatId, thread_id } = receivedMessage;
      const isCurrentChat = chatId === currentChat?.chat_id;
      console.log(messages)
      console.log(headMessage)
      if (isCurrentChat) {
        setMessages((prev) => {
          const updatedMessages = prev.map((message) =>
            message.id === headMessage?.id
              ? { ...message, is_thread_head: true, thread_id: thread_id }
              : message
          );

          return [...updatedMessages, receivedMessage];
        });

      }
    }
  }, [receivedMessage, currentChat?.chat_id]);


  //recieving reaction from socket server
  useEffect(() => {
    if (socket.current) {
      socket.current.on("recieve-reaction", (reactionData) => {


        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.id === reactionData.messageId) {
              return {
                ...msg,
                MessageReactions: [
                  ...msg?.MessageReactions.filter(
                    (reaction) => reaction.userId !== reactionData.userId
                  ),
                  {
                    userId: reactionData.userId,
                    reaction: reactionData.reaction,
                    user: {
                      username: reactionData.username
                    }
                  },
                ],
              };
            }
            return msg;
          })
        );
      });
    }
  }, [socket]);

  const handleReplyThread = async (threadId) => {
    try {
 
      if (!userThreads.current.includes(threadId)) {
        userThreads.current.push(threadId); 
  
        const response = await addMembersToThread(threadId, [currentUser.id]);
        console.log("User added to thread successfully:", response);
      }
    } catch (error) {
      console.error("Error in handleReplyThread:", error);
    }
  };

  return (
    <div className="flex flex-col relative h-screen w-full bg-slate-100 z-0">
      {/* Chat header */}
      <div className="flex relative items-center justify-between h-12 border border-solid border-gray-500 shadow-sm bg-white p-4 px-6 gap-6 z-50">
        <section className="flex items-center gap-6">
          <div className="flex justify-start items-center max-w-max h-10 cursor-pointer">
            <h1 className="font-semibold text-xl ">
              {currentChat?.Chat?.name ? currentChat.Chat?.name : currentChat?.User?.username}
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

        {chatSettingsOpened && chat.Chat.chat_type !== 'direct' && (
          <ChatSettings
            chat={currentChat}
            currentUser={currentUser}
            setchatSettingsOpened={setchatSettingsOpened}
            setchatInfoModalOpened={setchatInfoModalOpened}
          />
        )}
      </div>

      {/* pinned messages modal */}
      {pinnedMessages.length > 0 &&
        <PinMessageModal
          pinMessageModalOpen={pinMessageModalOpen}
          setPinMessageModalOpen={setPinMessageModalOpen}
          setActiveMessageId={setActiveMessageId}
        />}

      {/* chat info modal */}
      {chatInfoModalOpened && (
        <ChatInfo
          currentChat={currentChat}
          setChats={setChats}
          setMessages={setMessages}
          setchatInfoModalOpened={setchatInfoModalOpened}
        />
      )}

      {/* members list modal */}
      {membersListModalOpened && (
        <MembersList
          chat={currentChat}
          chatMembers={chatMembers}
          setmembersListModalOpened={setmembersListModalOpened}
          userPermissions={userPermissions}
        />
      )}
      {selectedThreadId && <GroupNameModal selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} />}

      {/* Scrollable message display */}
      <div className="message-display flex-1 flex flex-col gap-8 bg-white p-2 pt-8 overflow-auto custom-scrollbar">
        {messages.map((message, index) => {
          return (
            <div
              id={`message-${message.id}`}
              className={`message-container flex flex-col ${message.is_thread_head &&
                "border bg-gray-100 border-gray-300 shadow-lg rounded-lg cursor-pointer"
                } ${activeMessageId === message.id &&
                "animate-fadeOut border-orange-200"
                }`}

            // onClick={()=>{
            //   updateExpandThreadHead(message)
            //   updateCurrentThreadMessages(message)
            // }}
            >
              {/* Normal message */}
              {(!message.thread_id || message.is_thread_head) && (
                <Message
                  index={index}
                  message={message}
                  setMessages={setMessages}
                  currentUser={currentUser}
                  isGroup={isGroup}
                  socket={socket}
                  setreplyThread={setreplyThread}
                  setExpandedThreadHead={setExpandedThreadHead}
                  messageActionIndex={messageActionIndex}
                  setmessageActionIndex={setmessageActionIndex}
                  currentThreadMessages={currentThreadMessages}
                  onThreadClick={() => {
                    if (message.is_thread_head) {
                      updateExpandThreadHead(message);
                    }
                  }}
                />
              )}

              {/* Thread messages */}
              {message.is_thread_head &&
                expandedThreadHead?.id === message.id && (
                  <div className="flex flex-col m-2 mt-2">
                    {currentThreadMessages.map((threadMessage) => (
                      <Message
                        key={threadMessage.id}
                        message={threadMessage}
                        setMessages={setMessages}
                        currentUser={currentUser}
                        isGroup={isGroup}
                        expandedThreadHead={expandedThreadHead}
                        messageActionIndex={messageActionIndex}
                        setmessageActionIndex={setmessageActionIndex}
                      />
                    ))}
                  </div>
                )}

              {/* thread message input */}
              {message.is_thread_head &&
                expandedThreadHead?.id === message.id &&
                replyThread !== "" && (
                  <div className="border bottom-0 flex justify-evenly items-center focus:border-none focus:outline-none w-full h-18 bg-white p-4">
                    <input
                      type="text"
                      className="h-8 w-10/12 rounded-md border border-blue-400 focus:out     line-none p-2"
                      value={replyMessage}
                      onChange={handleReplyChange}
                    />
                    <button
                      className="h-7 w-14 bg-blue-500 hover:bg-blue-600 rounded-md"
                      onClick={()=>{
                        handleSend()
                        handleReplyThread(message?.thread_id)
                      }}
                    >
                      Send
                    </button>
                  </div>
                )}

              {/* thread message actions */}
              {message.is_thread_head && (
                <>
                  <div className="line w-full h-[1px] bg-gray-200 block"></div>
                  <div className="replies flex justify-between items-center px-2 bg-white w-full h-6 text-sm ">
                    <span className="text-blue-400">
                      {threadMap[message.thread_id]?.length} Replies
                    </span>
                    <section className="flex gap-2 justify-evenly items-center">
                      <CgMailReply
                        size={17}
                        className="hover:text-blue-400 cursor-pointer"
                        onClick={()=>setreplyThread("old")}
                      />
                      <BiMessageAltAdd className="hover:text-blue-400 cursor-pointer" onClick={() => setSelectedThreadId(message?.thread_id)} />
                    </section>
                  </div>
                </>
              )}

            </div>
          );
        })}
        {/* Scroll to bottom reference */}
        <div ref={messagesEndRef} />
        {isForwardMessageModalOpened && <ForwardMessageModal chats={chats} />}
      </div>

      {/* Fixed message input */}
      <div className="sticky border bottom-0 flex justify-evenly items-center focus:border-none focus:outline-none w-full h-20 bg-[#e5eaed] p-4">
        <input
          type="text"
          className="h-5/6 w-11/12 rounded-md border focus:outline-none"
          value={newMessage}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
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

        {/* <button
          className="h-7 w-14 bg-blue-500 hover:bg-blue-600 rounded-md"
          onClick={handleSend}
        >
          Send
        </button> */}
      </div>
    </div>
  );
};

export default React.memo(ChatBox);