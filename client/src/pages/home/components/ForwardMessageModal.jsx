import React from 'react';
import { useDispatch, useSelector } from "react-redux";

import { addMessage } from '../../../api/messageApi.js';

const ForwardMessageModal = () => {
  const dispatch = useDispatch()
  const forwardedMessage = useSelector(state => state.forwardMessage.forwardedMessage)
  const currentUser = useSelector(state => state.user.authUser)
  const chatMembers = useSelector(state => state.chats.chatMembers)
  const chats = useSelector(state => state.user.chats)

  const handleForwardMessageClick = async (chatId) => {
    const selectedChat = chats.find(chat => chat.chat_id === chatId)
    const forwardMessageData = {
      userIds: chatMembers.map(member => member.user_id),
      chatId,
      isForwarded: true,
      message: forwardedMessage,
      user: {
        id: currentUser.id,
        username: currentUser.username
      },
      forwardedMessage
    }
    try {
      await addMessage({ chatId, sender_id: currentUser.id, message: forwardedMessage.message, forwardedFromMessageId: forwardedMessage.id })
      dispatch({ type: "SET_CURRENT_CHAT", payload: selectedChat })
      dispatch({ type: "CLOSE_FORWARD_MESSAGE_MODAL" })
      dispatch({ type: "RESET_FORWARDED_MESSAGE" })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        className="bg-white w-96 max-h-96 rounded-lg p-4 shadow-lg overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Select Chat to Forward</h2>
        <div className="space-y-2">
          {chats?.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.chat_id}
                className="p-2 border rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => handleForwardMessageClick(chat.chat_id)}
              >
                {chat.user?.username ? chat.user.username : chat.Chat.name}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No chats available.</p>
          )}
        </div>
        <button
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          onClick={() => {
            dispatch({ type: "CLOSE_FORWARD_MESSAGE_MODAL" })
            dispatch({ type: "RESET_FORWARDED_MESSAGE" })
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
