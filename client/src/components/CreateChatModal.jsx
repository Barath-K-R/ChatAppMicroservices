import React, { useState, useEffect } from "react";
import { CiMap } from "react-icons/ci";
import { CiReceipt } from "react-icons/ci";
import { CiServer } from "react-icons/ci";
const CreateChatModal = ({
  setCreateChatModalOpened,
  setUserSearchModal,
  setcreateChannelModal,
  setcreateChatSelection,
}) => {
  return (
    <div
      className="create-chat-modal flex flex-col w-56 h-22 absolute top-12 left-40 shadow-xl list-none bg-white z-50"
      onMouseLeave={() => setCreateChatModalOpened(false)}
    >
      <section
        className="flex gap-2 pl-1 items-center cursor-pointer"
        onClick={() => {
          setUserSearchModal(true);
          setCreateChatModalOpened(false);
          setcreateChatSelection("direct");
        }}
      >
        <CiMap />
        <span>Send a direct Message</span>
      </section>
      <section
        className="flex gap-2 pl-1 items-center cursor-pointer"
        onClick={() => {
          setUserSearchModal(true);
          setCreateChatModalOpened(false);
          setcreateChatSelection("group");
        }}
      >
        <CiReceipt />
        <span>Start a Group conversation</span>
      </section>
      <section
        className="flex gap-2 pl-1 items-center cursor-pointer"
        onClick={() => {
          setcreateChatSelection("channel");
          setcreateChannelModal(true);
        }}
      >
        <CiServer />
        <span>Create a channel</span>
      </section>
    </div>
  );
};

export default CreateChatModal;