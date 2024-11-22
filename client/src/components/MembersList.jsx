import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { addMembersToChat, removeMembersFromChat } from "../api/ChatApi.js";
import { getAllOrgUser } from "../api/UserApi.js";
import AddMemberModal from "./AddMemberModal.jsx";
import { AiFillCloseCircle } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MembersList = ({
  chat,
  setmembersListModalOpened,
  userPermissions,
  chatMembers,
  setchatMembers,
}) => {
  const [filteredMembers, setfilteredMembers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgUsers, setOrgUsers] = useState(null);
  const [selectedUsers, setselectedUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [addMember, setaddMember] = useState(false);
  const currentUser = useSelector((state) => state.user.authUser);

  //handling user selection
  const handleUserClick = (user) => {
    if (selectedUsers.some((item) => item.id === user.id)) {
      // setselectedUsers user already in selectedUsers
      setselectedUsers((prev) => prev.filter((item) => item.id !== user.id));
    } else {
      // Add user to selected list
      setselectedUsers((prev) => {
        return [...prev, user];
      });
    }
  };

  //handling member selection
  const handleMemberCick = (member) => {
    if (selectedMembers.some((item) => item.user_id === member.user_id))
      setSelectedMembers((prev) =>
        prev.filter((item) => item.user_id !== member.user_id)
      );
    else setSelectedMembers((prev) => [...prev, member]);
  };

  //filtering user and members based on user search input
  useEffect(() => {
    const filterUser = () => {
      setFilteredUsers(
        orgUsers?.filter((user) => {
          if (user.username.startsWith(searchTerm)) return user;
        })
      );
      setfilteredMembers(
        chatMembers.filter((member) => {
          if (member.User.username.startsWith(searchTerm)) return member;
        })
      );
    };
    filterUser();
  }, [searchTerm]);

  //fetching all organization users
  useEffect(() => {
    setfilteredMembers(chatMembers);
    const fetchOrgUsers = async () => {
      try {
        const response = await getAllOrgUser(currentUser.organization_id);
        setOrgUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrgUsers();
  }, []);

  //handling addparticipant
  const handleAddParticipant = async () => {
    const addParticipantPermission = userPermissions.find(
      (permission) => permission.Permission.name === "add participants"
    );
    if (!addParticipantPermission) {
      toast.error("You do not have permission to add a participant!", {
        position: "top-right",
      });
      return;
    }
    try {
      const userIds = selectedUsers.map((user) => user.id);
      const chatMembers = await addMembersToChat(chat.chat_id, userIds);
      if (chatMembers) {
        toast.success("members were added successfully", {
          position: "top-right",
        });
        reset();
      }
    } catch (error) {
      console.log(error);
    }
  };

  //handling remove participants
  const handleRemoveParticipants = async () => {
    const removeParticipantPermission = userPermissions.find(
      (permission) => permission.Permission.name === "remove participants"
    );

    if (!removeParticipantPermission) {
      toast.error("You do not have permission to add a participant!", {
        position: "top-right",
      });
      return;
    }

    try {
      const userIds = selectedMembers?.map((member) => member?.user_id);
 
      const chatMembers = await removeMembersFromChat(chat.chat_id, userIds);
      if (chatMembers) {
        toast.success("members were removed successfully", {
          position: "top-right",
        });
        setchatMembers((prev) =>
          prev.filter((member) => {
            if (!userIds.includes(member.user_id))
              return member;
          })
        );
        reset();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const reset = () => {
    setselectedUsers([]);
    setSelectedMembers([]);
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 ">
      <div className="absolute inset-0 bg-black bg-opacity-55 " />
      <div className="relative bottom-0 flex flex-col items-center gap-6 w-3/6 h-[94%]  bg-white shadow-lg ">
        {/* title */}
        <div className="flex justify-between items-center w-full h-10 p-6 bg-gray-100">
          <section className="flex gap-3">
            <span
              className="font-semibold text-xl cursor-pointer"
              onClick={() => {
                setaddMember(false);
                reset();
              }}
            >
              {chat?.Chat?.name}
            </span>
            <span className="font-semibold text-xl">
              {addMember && "> add Member"}
            </span>
          </section>

          <AiFillCloseCircle
            size={24}
            className="cursor-pointer"
            onClick={() => setmembersListModalOpened(false)}
          />
        </div>

        {/* search div */}
        <div className="flex items-center gap-2 border pl-2 w-5/6 h-10 border-b-gray-200">
          <AiOutlineSearch size={24} className="cursor-pointer" />
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-300 focus:border-blue-500 focus:outline-none rounded px-4 py-2"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* add users list */}
        {addMember && (
          <div
            className={`flex w-5/6 h-3/6 flex-col gap-4 overflow-y-scroll`}
            style={{ maxHeight: "350px" }}
          >
            {filteredUsers &&
              filteredUsers.map((user) => {
                if (!user) return null;

                const isSelected = selectedUsers?.some(
                  (selectedUser) => selectedUser?.id === user?.id
                );

                return (
                  <div
                    key={user.id}
                    className={`flex items-center w-full h-14 ${isSelected ? "bg-blue-200" : "bg-white"
                      } gap-2 pl-4 rounded-md cursor-pointer hover:bg-gray-100`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex w-10 h-10 rounded-3xl text-2xl justify-center items-center bg-gray-300">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span>{user.username}</span>
                      <span>{user.email}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Add Participant Button */}
        <div className="flex justify-center w-full p-4 rounded-b-lg">
          <button
            className="w-36 h-10 bg-blue-500 hover:bg-opacity-75 rounded"
            onClick={() => {
              if (addMember) handleAddParticipant();
              else {
                reset();
                setaddMember(true);
              }
            }}
          >
            Add Partcipant
          </button>
        </div>

        {/*members list*/}
        {!addMember && (
          <div
            className={`flex w-5/6 h-3/6 flex-col gap-4 overflow-y-scroll`}
            style={{ maxHeight: "350px" }}
          >
            {filteredMembers &&
              filteredMembers.map((member) => {
                const isSelected = selectedMembers?.some(
                  (selectedUser) => selectedUser?.user_id === member?.user_id
                );

                return (
                  <div
                    key={member?.user_id}
                    className={`flex items-center justify-between w-full h-14 
                      ${isSelected ? "bg-blue-200" : "bg-white"}
                     gap-2 px-4 rounded-md cursor-pointer hover:bg-gray-100`}
                    onClick={() => handleMemberCick(member)}
                  >
                    <section className="flex items-center gap-4">
                      <div className="flex w-10 h-10 rounded-3xl text-2xl justify-center items-center bg-gray-300">
                        {member?.User?.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{member?.User?.username}</span>
                    </section>
                    <div className="box flex items-center justify-center w-6 h-6 bg-white rounded-md hover:border hover:border-gray-300">
                      <BsThreeDotsVertical className="cursor-pointer" />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Remove button */}
        <div className="remove pb-4">
          <button
            className="w-20 h-8 bg-blue-500 hover:bg-opacity-75 rounded-sm"
            onClick={handleRemoveParticipants}
          >
            remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembersList;
