import React, { useState, useEffect } from "react";
import { BiGroup } from "react-icons/bi";
import { useSelector,useDispatch } from "react-redux";
import { unseenMessageCount } from "../api/messageApi.js";
const  Conversations = ({ chat,currentChat, onlineUsers,currentUser }) => {
  const [useronline, setuserOnline] = useState(false);
  const [unssenMessagesCount, setunssenMessagesCount] = useState(0)

  const dispatch=useDispatch()
  useEffect(() => {
      if(currentChat===chat)
      setunssenMessagesCount(0);
  }, [currentChat])
  
  // checking user is online
  useEffect(() => {
    const checkUserIsOnline = () => {
      setuserOnline(() =>
        onlineUsers.some((user) => user.userId === chat?.User?.id)
      );
    };
    checkUserIsOnline();
  }, [onlineUsers]);

  // fetching the count of unseen messages
  useEffect(() => {
     const getunseenMessageCount=async()=>{
        try {
          const unseenCountResponse=await unseenMessageCount(chat?.chat_id,currentUser.id);
          
          setunssenMessagesCount(unseenCountResponse.data.unseenReadReceipts)
        } catch (error) {
           console.log(error)
        }
     }
  
     getunseenMessageCount();
  }, [])
  
  return (
    <div
      className="relative flex items-center justify-start text-white hover:bg-[#174b65] pl-4 gap-4 h-10 w-11/12 cursor-pointer rounded-lg"
      onClick={() => {
        dispatch({type:"SET_CURRENT_CHAT",payload:chat})
      }}
    >
      {useronline && chat?.Chat?.chat_type === "direct" && (
        <div className="absolute h-[12px] w-[12px] bg-green-400 left-8 bottom-6 rounded-2xl"></div>
      )}
      {chat?.Chat?.chat_type === "direct" && (
        <div className="w-6 h-6 text-center bg-white rounded-xl">
          {chat?.User?.username.charAt(0).toUpperCase()}
        </div>
      )}
      {chat?.Chat?.chat_type !== "direct" && <BiGroup size={24} />}
      <span className="text-white">
        {chat?.Chat?.name ? chat?.Chat?.name : chat?.User?.username}
      </span>
      <span className="text-green-200">{unssenMessagesCount>0 && unssenMessagesCount}</span>
    </div>
  );
};

export default React.memo(Conversations);
