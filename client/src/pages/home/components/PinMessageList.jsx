import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { BsPinFill } from "react-icons/bs";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiMessageAltCheck } from "react-icons/bi";
const PinMessageList = ({ pinnedMessages, chatMembers, setActiveMessageId }) => {

  const dispatch = useDispatch()

  const locateMessage = (id) => {
    setActiveMessageId(id);
    document.getElementById(`message-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      setActiveMessageId(null);
    }, 2000);
  };

  const handleUnpinMessage = (message) => {
    dispatch({ type: "UNPIN_MESSAGE", payload: message })
  }

  return (
    <div className='pinmessagelist-container absolute flex flex-col min-h-96 w-5/12 top-9 right-4 bg-white rounded-lg shadow-lg z-50'>
      <div className="header flex items-center p-2 bg-gray-100 font-semibold">
        <span>Pinned Messsages ({pinnedMessages.length})</span>
      </div>

      <div className="messgaes-list">
        {pinnedMessages.map((message, index) => {
          return (
            <div className={`message flex gap-2 p-4 justify-between ${index === 0 ? 'bg-orange-50' : 'bg-white hover:bg-gray-100 '}`}>
              <section className='flex gap-3'>
                <div className="profile flex justify-center items-center bg-gray-200 h-6 w-6 rounded-2xl">{chatMembers.find(member => member.user_id === message.sender_id).User.username.charAt(0).toUpperCase()}</div>
                <div className="message-content flex flex-col">
                  <span className='font-semibold'>{chatMembers.find(member => member.user_id === message.sender_id).User.username}</span>
                  <span>{message.message}</span>
                </div>
              </section>
              <div className="settings-container flex gap-2 items-center">
                <div className="wrapper flex justify-center items-center h-7 w-7 border bg-gray-100 hover:bg-white hover:text-blue-500 relative"
                  onClick={() => handleUnpinMessage(message)}>
                  <BsPinFill />
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="w-[1px] h-full bg-black transform rotate-45 absolute"></div>
                  </div>
                </div>
                <div className="wrapper flex justify-center items-center h-7 w-7 border bg-gray-100 hover:bg-white hover:text-blue-500"
                  onClick={() => locateMessage(message.id)}>
                  <BiMessageAltCheck />
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default PinMessageList