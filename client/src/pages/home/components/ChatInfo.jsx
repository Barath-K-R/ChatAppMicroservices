import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AiFillCloseCircle } from "react-icons/ai";
import { TiGroup } from "react-icons/ti";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "react-toastify";
import {
  addRolePermissions,
  getAllRolePermissions,
  deleteChat,
} from "../../../api/ChatApi.js";
import { deleteMessages } from "../../../api/messageApi.js";

const ChatInfo = ({ currentChat, setMessages, setChats, setchatInfoModalOpened }) => {
  const permissionsTableRowActions = [
    "edit chat info",
    "add participants",
    "remove participants",
    "clear all messages",
    "delete chat",
    "send message",
    "reply in thread",
    "leave chat",
    "delete messages",
  ];

  const permissions = useSelector(state => state.chats.chatPermissions)
  const currentUserRole = useSelector(state => state.chats.currentUserRole)
  const [changedPermissions, setChangedPermissions] = useState({
    admin: [],
    moderator: [],
    member: [],
  });

  const [isModalOpened, setisModalOpened] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchAllRolePermissions = async () => {
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
        })
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchAllRolePermissions();
  }, []);

  const handleClearChat = async () => {

    const userPermissions = permissions[currentUserRole] || [];

    if (currentChat.Chat.chat_type === 'channel' && !userPermissions.includes("clear all messages")) {
      toast.error("You do not have permission to clear all messages!", {
        position: "top-right",
      });
      return;
    }

    try {
      const clearMessageResponse = await deleteMessages(currentChat.chat_id);

      if (clearMessageResponse) setMessages([]);
      setisModalOpened(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePermissionChange = (role, action) => {
    const userPermissions = permissions[currentUserRole] || [];
    if (!userPermissions.includes("edit chat info")) {
      toast.error("You do not have permission to edit chat permissions.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setChangedPermissions((prevPermissions) => {
      const roleChanges = prevPermissions[role] || [];
      if (roleChanges.includes(action)) {
        return {
          ...prevPermissions,
          [role]: roleChanges.filter((perm) => perm !== action),
        };
      } else {
        return {
          ...prevPermissions,
          [role]: [...roleChanges, action],
        };
      }
    });

    const rolePermissions = permissions[role] || [];
    const updatedPermissions = rolePermissions.includes(action)
      ? rolePermissions.filter((perm) => perm !== action)
      : [...rolePermissions, action];

    dispatch({
      type: "UPDATE_PERMISSIONS",
      payload: { role, updatedPermissions },
    });
  };


  const handleDelete = async () => {
    const deleteChatPermission = permissions[currentUserRole]?.includes("delete chat");

    if (currentChat.Chat.chat_type === 'channel' && !deleteChatPermission) {
      toast.error("You do not have permission to delete this chat!", {
        position: "top-right",
      });
      return;
    }

    try {
      const chatDeleteResponse = await deleteChat(currentChat.chat_id);

      setChats((prev) => prev.filter((chat) => chat.chat_id !== currentChat.chat_id));
      setchatInfoModalOpened(false);
      dispatch({ type: "RESET_CURRENT_CHAT" })
      toast.success("Chat deleted successfully!", {
        position: "top-right",
      });
    } catch (error) {
      console.error("An error occurred while deleting the chat:", error);
    }
  };

  const handleContinue = async () => {
    console.log(changedPermissions);

    try {
      const permissionsResponse = await addRolePermissions(
        currentChat?.chat_id,
        changedPermissions
      );

      setChangedPermissions({
        admin: [],
        moderator: [],
        member: [],
      });

      setchatInfoModalOpened(false);
    } catch (error) {
      console.log("Error updating permissions:", error);
    }
  };

  return (
    <div className="fixed flex justify-end inset-0 bg-black bg-opacity-55 z-50">
      <div className="h-full w-3/6 bg-white">
        {/* title */}
        <div className="flex justify-between items-center w-full h-10 p-6 bg-gray-100">
          <div className="title flex gap-2 items-center justify-around">
            <span className="font-semibold text-xl cursor-pointer">
              {currentChat?.Chat?.chat_type === "group" ? "Groups" : "channels"}
            </span>
            <span>{">"}</span>
            <span className="font-semibold text-xl cursor-pointer">
              {currentChat?.Chat?.name}
            </span>
          </div>
          <AiFillCloseCircle
            size={24}
            className="cursor-pointer"
            onClick={() => setchatInfoModalOpened(false)}
          />
        </div>

        {/* previewHead */}
        <div className="info flex w-full h-24 justify-around">
          <div className="chatinfo flex items-center justify-around gap-4 p-4">
            <div className="image flex items-center justify-center w-16 h-16 border border-gray-200 shadow-md rounded-lg">
              <TiGroup size={30} />
            </div>
            <div className="name flex flex-col">
              <span className="font-semibold text-lg">
                {currentChat?.Chat?.name}
              </span>
              <span className="text-sm text-gray-500">Created by you</span>
            </div>
          </div>
          <div className="edit-info relative flex items-center gap-4 p-4">
            <div
              className="threedots flex justify-center items-center h-6 w-6 rounded-2xl border cursor-pointer hover:bg-gray-200"
              onClick={() => setisModalOpened((prev) => !prev)}
            >
              <BsThreeDotsVertical size={15} />
            </div>
            {isModalOpened && (
              <div className="settings-modal absolute top-[65px] right-52 w-32 p-2 bg-white border shadow-lg rounded-md">
                <ul>
                  <li
                    className="py-1 px-2 text-red-500 hover:bg-gray-100 cursor-pointer"
                    onClick={handleClearChat}
                  >
                    Clear
                  </li>
                  <li
                    className="py-1 px-2 text-red-500 hover:bg-gray-100 cursor-pointer"
                    onClick={handleDelete}
                  >
                    Delete
                  </li>
                </ul>
              </div>
            )}
            <div
              className="leavebtn flex justify-center items-center w-20 h-8 text-sm
                 text-red-500 hover:bg-red-50 border border-red-500 rounded-3xl cursor-pointer"
            >
              <button>Leave</button>
            </div>
            <div
              className="continuebtn flex justify-center items-center w-20 h-8 text-white text-sm
                   bg-blue-400 hover:bg-blue-500 border border-blue-500 rounded-3xl cursor-pointer"
            >
              <button onClick={handleContinue}>Continue</button>
            </div>
          </div>
        </div>

        {/* ViewOption */}
        <div className="viewoption flex items-center w-full h-10 border-b">
          <div
            className="permissions flex items-center justify-center h-full 
              text-sm font-semibold border-b-2 border-blue-400 px-2 mx-2 cursor-pointer"
          >
            Permissions
          </div>
        </div>

        {/* Permissions Table */}
        <div className="permissionstable flex flex-col h-5/6 items-start p-4 overflow-scroll">
          <div className="table w-full border border-gray-300">
            <div className="flex w-full bg-gray-100 font-semibold text-sm">
              <div className="w-1/4 h-12 flex justify-center items-center border-b border-r border-gray-300 ">
                Action
              </div>
              <div className="w-1/4 h-12 flex justify-center items-center border-b border-r border-gray-300">
                Channel Admin
              </div>
              <div className="w-1/4 h-12 flex justify-center items-center border-b border-r border-gray-300 ">
                Moderators
              </div>
              <div className="w-1/4 h-12 flex justify-center items-center border-b border-gray-300 ">
                Members
              </div>
            </div>

            {permissionsTableRowActions.map((action, index) => (
              <div key={index} className="flex w-full">
                <div className="w-1/4 h-12 flex justify-center items-center text-sm">
                  {action}
                </div>
                {/* Admin Checkbox */}
                <div className="w-1/4 h-12 flex justify-center items-center">
                  <input
                    type="checkbox"
                    checked={permissions.admin.includes(action)}
                    className="cursor-pointer"
                    disabled={currentChat?.Chat?.chat_type !== "channel"}
                    onChange={() =>
                      currentChat?.Chat?.chat_type === "channel" &&
                      handlePermissionChange("admin", action)
                    }
                  />
                </div>
                {/* Moderator Checkbox */}
                <div className="w-1/4 h-12 flex justify-center items-center">
                  <input
                    type="checkbox"
                    checked={permissions.moderator.includes(action)}
                    className="cursor-pointer"
                    disabled={currentChat?.Chat?.chat_type !== "channel"}
                    onChange={() =>
                      currentChat?.Chat?.chat_type === "channel" &&
                      handlePermissionChange("moderator", action)
                    }
                  />
                </div>
                {/* Member Checkbox */}
                <div className="w-1/4 h-12 flex justify-center items-center">
                  <input
                    type="checkbox"
                    checked={permissions.member.includes(action)}
                    className="cursor-pointer"
                    disabled={currentChat?.Chat?.chat_type !== "channel"}
                    onChange={() =>
                      currentChat?.Chat?.chat_type === "channel" &&
                      handlePermissionChange("member", action)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInfo;