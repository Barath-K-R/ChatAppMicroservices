import React, { useEffect, useState } from "react";
import { getAllOrgUser } from "../../../api/UserApi";
import { AiFillCloseCircle } from "react-icons/ai";
import { useSelector } from "react-redux";

const CreateChannelModal = ({
  setcreateChannelModal,
  selectedUsers,
  setselectedUsers,
  setchatData,
  chatData,
  handleCreateChat,
}) => {
  const user = useSelector((state) => state.user.authUser);

  const [orgUsers, setOrgUsers] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [addParticpantModal, setaddParticpantModal] = useState(false);

  const buttonStyles = {
    backgroundColor: "bg-blue-400",
    borderRadius: "rounded-3xl",
  };
  const resetChatData = () => {
    setchatData((prev) => {
      return {
        ...prev,
        name: "",
        scope: "",
        visibility: "",
        description: "",
      };
    });
  };
  //fetching all organization users
  useEffect(() => {
    const fetchOrgUsers = async () => {
      try {
        const response = await getAllOrgUser(user.organization_id);
        setOrgUsers(response.data);
        setFilteredUsers(response.data.slice(0, 1));
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrgUsers();
  }, []);

  //filtering user based on user selection
  useEffect(() => {
    const filterUser = () => {
      const filtered = orgUsers?.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("filtered users ");
      console.log(filtered?.slice(0, 1));
      setFilteredUsers(filtered?.slice(0, 1));
    };
    filterUser();
  }, [searchTerm, orgUsers]);

  const handleUserClick = (user) => {
    console.log("handling user click");
    console.log(user);

    if (selectedUsers.some((item) => item.id === user.id)) {
      // Remove user if already selected
      setselectedUsers((prev) => prev.filter((item) => item.id !== user.id));
    } else {
      console.log("directly adding");
      // Add user to selected list
      setselectedUsers((prev) => [...prev, user]);
    }
  };

  return (
    <div className="fixed flex justify-end inset-0 bg-black bg-opacity-55 z-50">
      <div className="absolute w-3/6 h-full bg-white z-50 overflow-scroll">
        {/* title */}
        <div className="flex justify-between items-center w-full h-10 p-6 bg-gray-100">
          <span className="font-semibold text-xl">Create Channel</span>
          <AiFillCloseCircle
            size={24}
            className="cursor-pointer"
            onClick={() => {
              resetChatData();
              setcreateChannelModal(false);
              setselectedUsers([]);
            }}
          />
        </div>

        <div className="flex flex-col w-12/12 h-full mx-6 gap-6">
          <p className="pt-6 text-gray-500">
            Channels are meant for enhanced collaboration across your
            organization. You can create channels for the entire organization,
            your team or across multiple teams.
          </p>
          {/* channel scope type */}
          <div className="flex justify-evenly items-center text-gray-600 w-12/12 h-1/6 rounded-md border hover:border-blue-300 bg-gray-100">
            <div
              className={`organization flex justify-center items-center w-[30%] h-[35%] bg-white border border-2 ${chatData.scope === "organization"
                  ? "border-blue-400"
                  : "border-gray-300"
                } hover:bg-blue-100 cursor-pointer`}
              onClick={() =>
                setchatData((prev) => {
                  return { ...prev, scope: "organization" };
                })
              }
            >
              <span>Organization</span>
            </div>
            <div
              className={`personal flex justify-center items-center w-[30%] h-[35%] bg-white border border-2 ${chatData.scope === "personal"
                  ? "border-blue-400"
                  : "border-gray-300"
                } hover:bg-blue-100 cursor-pointer`}
              onClick={() =>
                setchatData((prev) => {
                  return { ...prev, scope: "personal" };
                })
              }
            >
              <span>Personal</span>
            </div>
          </div>
          {/* channel name */}
          <div className="flex justify-between items-center w-full h-[6%]">
            <h2 className="w-2/6 pl-4">Channel Name</h2>
            <input
              type="text"
              placeholder="Channel Name"
              className="w-4/6 h-full border border-gray-300 focus:outline-none pl-2 rounded-md"
              onChange={(e) =>
                setchatData((prev) => {
                  return { ...prev, name: e.target.value };
                })
              }
            />
          </div>
          {/* add participants */}
          <div className="relative flex justify-between items-center w-full h-[6%]">
            <h2 className="w-2/6 pl-4">Add Participants</h2>
            <div className="flex w-4/6 h-10 border justify-start items-center border-gray-300 pl-2 rounded-md gap-4 overflow-hidden">
              {selectedUsers.length > 0 &&
                selectedUsers.map((user) => (
                  <div className="selectedusers w-2/6 h-4/6 rounded-sm bg-blue-200">
                    <div
                      key={user.id}
                      className="user flex justify-between items-center w-full h-full text-black p-2 gap-2"
                    >
                      {user.username}
                      <AiFillCloseCircle
                        className="cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      />
                    </div>
                  </div>
                ))}

              <input
                type="text"
                placeholder="Launch the channel by adding a few members"
                className="w-full h-full focus:outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={() => setaddParticpantModal(true)}
              />
            </div>

            {addParticpantModal && (
              <div
                className="absolute left-56 top-12 w-[62%] h-18 bg-white rounded-md z-50 p-2 shadow-xl"
                onClick={() => setaddParticpantModal(false)}
                onMouseLeave={() => setaddParticpantModal(false)}
              >
                {filteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-start items-center bg-gray-100 w-full h-full rounded-sm pl-2 gap-4 cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center justify-center text-xl bg-gray-400 w-8 h-8 rounded-[50%]">
                      {user.username.charAt(0)}
                    </div>
                    <section className="flex flex-col justify-evenly">
                      <span>{user.username}</span>
                      <span className="text-gray-500">{user.email}</span>
                    </section>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* open or closed */}
          <div className="flex justify-start items-center w-full h-[6%]">
            <h2 className="w-2/6 pl-4">Visiblilty</h2>
            <div className="flex section justify-between items-center w-2/6 h-full rounded-3xl bg-gray-100 px-2 py-1">
              <div
                className={`flex justify-center items-center open w-3/6 h-full ${chatData.visibility === "open" && buttonStyles.backgroundColor
                  } rounded-3xl text-sm cursor-pointer`}
                onClick={() =>
                  setchatData((prev) => {
                    return { ...prev, visibility: "open" };
                  })
                }
              >
                Open to All
              </div>
              <div
                className={`flex justify-center items-center closed w-3/6 h-full ${chatData.visibility === "closed" &&
                  buttonStyles.backgroundColor
                  } rounded-3xl text-sm cursor-pointer`}
                onClick={() =>
                  setchatData((prev) => {
                    return { ...prev, visibility: "closed" };
                  })
                }
              >
                Closed
              </div>
            </div>
          </div>
          {/* channel description */}
          <div className="flex justify-between items-center w-full h-[20%]">
            <h2 className="w-2/6 pl-4">Channel Description</h2>
            <input
              type="text"
              placeholder="Channel Description"
              className="w-4/6 h-full border border-gray-300 focus:outline-none pl-2 rounded-md"
              onChange={(e) =>
                setchatData((prev) => {
                  return { ...prev, description: e.target.value };
                })
              }
            />
          </div>
          {/* buttons */}
          <div className="flex justify-end gap-12">
            <button
              className="w-28 h-10 bg-white rounded-3xl border border-gray-300 hover:bg-gray-200"
              onClick={() => {
                resetChatData();
                setcreateChannelModal(false);
                setselectedUsers([]);
              }}
            >
              cancel
            </button>
            <button
              className="w-28 h-10 bg-blue-400 rounded-3xl hover:bg-blue-500"
              onClick={() => {
                handleCreateChat();
                setcreateChannelModal(false);
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;
