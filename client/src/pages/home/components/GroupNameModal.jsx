import React, { useState } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { AiFillCloseCircle } from "react-icons/ai";
import { convertThreadToGroup } from '../../../api/ChatApi.js';

const GroupNameModal = ({ selectedThreadId, setSelectedThreadId }) => {
  const [groupData, setgroupData] = useState({
    name: "",
    description: "",
  })
  const dispatch= useDispatch();
  const currentUser = useSelector((state) => state.user.authUser);

  const handleChange = (e) => {
    setgroupData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupData.name.trim() || !groupData.description.trim()) {
      alert("Please fill in all the fields.");
      return;
    }
    const newGroupData = {
      ...groupData,
      currentUserId: currentUser.id,
      organization_id: currentUser.organization_id,
    };
    console.log(newGroupData)
    try {
      const newGroup = await convertThreadToGroup(selectedThreadId, newGroupData);
      setSelectedThreadId(null);
      dispatch({type:"SET_CURRENT_CHAT",payload:newGroup.data})
    } catch (error) {

      console.error("Failed to create group:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <h2 className="text-lg font-semibold mb-4">Create Group</h2>
        <form>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter group name"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500"
              value={groupData.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Description
            </label>
            <textarea
              name="description"
              placeholder="Enter group description"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500"
              rows="3"
              value={groupData.description}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
              onClick={() => setSelectedThreadId(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupNameModal;
