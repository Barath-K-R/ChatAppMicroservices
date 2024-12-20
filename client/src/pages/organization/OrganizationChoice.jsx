import React, { useState } from "react";
import {useSelector} from 'react-redux'
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

import { createOrganization } from "../../api/organizationApi.js";
import { joinOrganization } from "../../api/UserApi.js";

const OrganizationChoice = () => {
  const [choice, setChoice] = useState(null);
  const [orgName, setOrgName] = useState("");

  const dispatch=useDispatch()
  const currentUser = useSelector(state => state.user.authUser);

  const handleChoice = (selectedChoice) => {
    setChoice(selectedChoice);
    setOrgName("");  
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let orgResponse=null;
    try {
      if (choice === "create") {
        orgResponse=await createOrganization({ orgName, userId: currentUser.id });
        toast.success("Organization created successfully!", {
          position: "top-right",
          autoClose: 3000, 
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else if (choice === "join") {
        orgResponse=await joinOrganization({orgName, userId: currentUser.id });
        toast.success("Successfully joined the organization!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
      console.log(orgResponse)
      dispatch({type:"UPDATE_USER_ORG",payload:orgResponse.data.organization_id})
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0a2532]">
      {/* Welcome message */}
      <h1 className="text-4xl text-white mb-6">Hello, Welcome to Chat App!</h1>

      {/* Choice buttons */}
      {choice === null && (
        <div className="flex gap-6">
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded"
            onClick={() => handleChoice("create")}
          >
            Create Organization
          </button>
          <button
            className="px-6 py-3 bg-green-500 text-white rounded"
            onClick={() => handleChoice("join")}
          >
            Join Organization
          </button>
        </div>
      )}

      {/* Organization input form */}
      {choice && (
        <div className="mt-8 w-1/3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-white">
              {choice === "create" ? "Enter Organization Name to Create:" : "Enter Organization Name to Join:"}
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="p-2 rounded bg-gray-700 text-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-balck rounded hover:bg-gray-200"
            >
              {choice === "create" ? "Create Organization" : "Join Organization"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrganizationChoice;
