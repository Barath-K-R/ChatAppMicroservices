import React from "react";
import { BsChatLeftTextFill } from "react-icons/bs";
import { BsChatRightQuoteFill } from "react-icons/bs";
import { BsCollectionFill } from "react-icons/bs";
import { TiGroup } from "react-icons/ti";
import { useDispatch } from "react-redux";

const ServiceBar = () => {
  const dispatch=useDispatch();

  return (
    <div className="flex flex-col items-center pt-2 w-16 h-full gap-2 bg-[#0a2532] text-[#66c2ff]">
      <div className="flex flex-col w-full h-14 items-center justify-center hover:bg-[#0a3244] cursor-pointer" onClick={()=>dispatch({type:'ADD_SELECTION',payload:'direct'})}>
        <BsChatLeftTextFill size={24}/> 
        <span className="text-xs">Chats</span>
      </div>
      <div className="flex flex-col w-full h-14 items-center justify-center hover:bg-[#0a3244] cursor-pointer" onClick={()=>dispatch({type:'ADD_SELECTION',payload:'group'})}>
        <BsChatRightQuoteFill size={24} />
        <span className="text-xs">Group</span>
      </div>
      <div className="flex flex-col w-full h-14 items-center justify-center hover:bg-[#0a3244] cursor-pointer" onClick={()=>dispatch({type:'ADD_SELECTION',payload:'channel'})}>
        <TiGroup size={24}/>
        <span className="text-xs">Channels</span>
      </div>
    </div>
  );
};

export default ServiceBar;
