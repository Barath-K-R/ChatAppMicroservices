import React from 'react'
import { useSelector, useDispatch } from "react-redux";

import { CiUser } from "react-icons/ci";
import { BsThreeDotsVertical } from "react-icons/bs";
const ChatBoxHeader = ({ setmembersListModalOpened, setchatSettingsOpened, chatSettingsOpened }) => {

    const currentChat = useSelector(state => state.chats.currentChat)
    const chatMembers = useSelector(state => state.chats.chatMembers)
    const currentUser = useSelector(state => state.user.authUser);

    return (
        <>
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

            {chatSettingsOpened && currentChat.Chat.chat_type !== 'direct' && (
                <ChatSettings
                    chat={currentChat}
                    currentUser={currentUser}
                    setchatSettingsOpened={setchatSettingsOpened}
                    setchatInfoModalOpened={setchatInfoModalOpened}
                />
            )}
        </>
    )
}

export default ChatBoxHeader