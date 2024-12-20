import React from 'react'
import { useSelector } from 'react-redux';
import { BsThreeDots } from "react-icons/bs";
import { AiFillPushpin } from "react-icons/ai";
import PinnMessageList from './PinMessageList.jsx'
import PinMessageList from './PinMessageList.jsx';

const PinMessageModal = ({ pinMessageModalOpen, setPinMessageModalOpen, setActiveMessageId }) => {
  const chatMembers = useSelector(state => state.chats.chatMembers)
  const pinnedMessages = useSelector(state => state.chats.pinnedMessages)

  const locateMessage = (id) => {
    setActiveMessageId(id);
    document.getElementById(`message-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      setActiveMessageId(null);
    }, 2000);
  };

  return (
    <div className='pinmessagemodal-container relative flex items-center justify-between h-10 pl-2 pr-4 border border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer rounded-md'
      onClick={() => locateMessage(pinnedMessages[0].id)}>
      <section className='message-details flex gap-2 pl-1  border border-x-2 border-orange-100 border-l-orange-400 '>
        <span className='text-orange-400'>{chatMembers.find(member => member.user_id === pinnedMessages[0].sender_id).User.username} :</span>
        <span>{pinnedMessages[0].message}</span>
      </section>
      <div className="pin flex items-center justify-center h-6 w-6 rounded-md bg-white hover:text-blue-500"
        onClick={() => setPinMessageModalOpen(prev => !prev)}>
        <AiFillPushpin />
      </div>
      {pinMessageModalOpen &&
        <PinMessageList
          pinnedMessages={pinnedMessages}
          chatMembers={chatMembers}
          setActiveMessageId={setActiveMessageId}
        />}

    </div>
  )
}

export default PinMessageModal