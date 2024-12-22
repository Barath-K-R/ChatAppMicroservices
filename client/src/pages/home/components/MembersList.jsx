import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { addMembersToChat, removeMembersFromChat,updateRole} from "../../../api/ChatApi.js";
import { getAllOrgUser } from "../../../api/UserApi.js";
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
  const [isUserPromotionModalOpened, setisUserPromotionModalOpened] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const dispatch = useDispatch()

  const currentUser = useSelector((state) => state.user.authUser);
  const permissions = useSelector(state => state.chats.chatPermissions)
  const currentUserRole = useSelector(state => state.chats.currentUserRole)
  const currentChat=useSelector(state=>state.chats.currentChat)

  //updating user role
  const updateUserRole = async(newRole) => {
    if (!selectedMemberId) {
      toast.error("No user selected for role update!", {
        position: "top-right",
      });
      return;
    }

    const userPermissions = permissions[currentUserRole] || [];

    if (currentChat.Chat.chat_type==='channel' && !userPermissions.includes("promote users")) {
      toast.error("You do not have permission to promote users!", {
        position: "top-right",
      });
      return;
    }

    try {
      await updateRole(currentChat.chat_id, selectedMemberId, newRole);

      dispatch({
        type: "UPDATE_MEMBER_ROLE",
        payload: {
          userId: selectedMemberId,
          newRole,
        },
      });
  
      toast.success(`User role updated to ${newRole}`, {
        position: "top-right",
      });
  
      setisUserPromotionModalOpened(false);
      setSelectedMemberId(null);
    } catch (error) {
      toast.error("Error updating user role.", {
        position: "top-right",
      });
      console.error("Error updating user role:", error);
    }
  };

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
    const userPermissions = permissions[currentUserRole] || [];

    if (!userPermissions.includes("add participants")) {
      toast.error("You do not have permission to add a participant!", {
        position: "top-right",
      });
      return;
    }
    console.log(selectedUsers)
    try {
      const userIds = selectedUsers.map((user) => user.id);
      const addMembersResposne = await addMembersToChat(chat.chat_id, userIds);
      if (addMembersResposne) {
        toast.success("Members were added successfully", {
          position: "top-right",
        });
        dispatch({type:"ADD_CHAT_MEMBERS",payload:addMembersResposne.data.newMembersWithDetails})
        reset();
      }
    } catch (error) {
      console.log(error);
    }
  };

  //handling remove participants
  const handleRemoveParticipants = async () => {
    const userPermissions = permissions[currentUserRole] || [];

    if (!userPermissions.includes("remove participants")) {
      toast.error("You do not have permission to remove a participant!", {
        position: "top-right",
      });
      return;
    }

    try {
      const userIds = selectedMembers?.map((member) => member?.user_id);

      const updatedChatMembers = await removeMembersFromChat(chat.chat_id, userIds);
      if (updatedChatMembers) {
        toast.success("Members were removed successfully", {
          position: "top-right",
        });
        dispatch({type:"REMOVE_CHAT_MEMBERS",payload:userIds})
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
      <div className="absolute inset-0 bg-black bg-opacity-70 " />
      <div className="whitebox relative bottom-0 flex flex-col items-center gap-6 w-3/6 h-[94%] bg-white shadow-lg ">
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
            className={`flex w-5/6 h-3/6 flex-col gap-4 custom-scrollbar overflow-y-scroll`}
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
                    <div className="box relative flex items-center justify-center w-6 h-6 bg-white rounded-md hover:border hover:border-gray-300"
                      onClick={() => {
                        setisUserPromotionModalOpened(prev => !prev)
                        setSelectedMemberId(member.User.id)
                      }}>
                      <BsThreeDotsVertical className="cursor-pointer" />
                      {isUserPromotionModalOpened && selectedMemberId === member.User.id && currentChat.Chat.chat_type==='channel' && (
                        <div
                          className="userpromotionmodal absolute w-48 text-[16px] bg-white shadow-lg border rounded-md z-50 p-2"
                          style={{
                            top: "110%", // Offset to show below the three dots
                            right: 20
                          }}
                        >
                          <ul>
                            <li className="p-1 hover:text-blue-500 hover:bg-blue-100" onClick={() => updateUserRole('admin')}>
                              <span>Assign as admin</span>
                            </li>
                            <li className="p-1 hover:text-blue-500 hover:bg-blue-100" onClick={() => updateUserRole('moderator')}>
                              <span>Assign as moderator</span>
                            </li>
                          </ul>
                        </div>
                      )}

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
