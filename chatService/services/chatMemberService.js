import * as chatMemberRepository from '../database/repositories/chatMemberRepository.js'
import * as roleRepository from '../database/repositories/rolerepository.js'
import * as chatRepository from '../database/repositories/chatRepository.js'
import { createChannel } from '../utils/index.js';
import axios from 'axios'

export const getChatMembers = async (chatId) => {
    if (!chatId) {
        return { error: "Missing chatId parameter" };
    }

    try {
        const chatMembers = await chatMemberRepository.getChatMembersByChatId(chatId);
        const userIds = chatMembers.map(member => member.user_id);

        if (userIds.length === 0) {
            return chatMembers;
        }

        let userDetails;

        try {
            const response = await axios.post('http://localhost:8000/users/ids', {userIds});

            userDetails = response.data;
        } catch (error) {
            console.error("Error fetching user details:", error);
        }

        const chatMembersWithUserDetails = chatMembers.map((member) => {
            const user = userDetails?.find((user) => user.id === member.user_id) || {};
            return {
                ...member.toJSON(),
                User: user,
            };
        });

        return chatMembersWithUserDetails;

    } catch (error) {
        console.error("Error fetching chat members:", error);
        return { error: "Couldn't retrieve the members." };
    }
};

export const addMembersToChat = async (chatId, userIds) => {
    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return { status: 404, error: "Chat not found" };

        let userDetails = [];
        try {
            
            const response = await axios.post('http://localhost:8000/users/ids', {userIds});

            if (response.status === 200) {
                userDetails = response.data; 
            } else {
                throw new Error(`Failed to fetch user details, status code: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { status: 500, error: "Failed to validate users" };
        }
        const fetchedUserIds = userDetails?.map(user => user.id) || [];
        if (fetchedUserIds.length !== userIds.length) {
            return { status: 404, error: "One or more users not found" };
        }

        let roleId = null;
        if (chat.chat_type === 'channel')
            roleId = await roleRepository.getRoleIdByName("member");
        const membersToAdd = userIds.map(userId => ({
            chat_id: chatId,
            user_id: userId,
            role_id: roleId,
        }));

        const newMembers = await chatMemberRepository.addMembersToChatInRepo(membersToAdd);

        const roles = await roleRepository.getAllRoles();
        const newMembersWithDetails = newMembers.map(member => {
            const userDetail = userDetails.find(user => user.id === member.user_id) || {};
            const roleDetail = roles.find(role => role.id === member.role_id) || {};

            return {
                ...member.toJSON(),
                User: userDetail || null,
                Role: roleDetail || null,
            };
        });
        return { newMembersWithDetails, message: "Members added successfully" };

    } catch (error) {
        console.error("Error adding members:", error);
        return { status: 500, error: "An error occurred while adding members." };
    }
};


export const removeMembersFromChat = async (chatId, userIds) => {
    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return { error: "Chat not found" };

        let userDetails = [];
        try {
            
            const response = await axios.post('http://localhost:8000/users/ids', {userIds});

            if (response.status === 200) {
                userDetails = response.data; // Assuming the response contains an array of user details
            } else {
                throw new Error(`Failed to fetch user details, status code: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { error: "Failed to validate users" };
        }

        const fetchedUserIds = userDetails?.map(user => user.id) || [];
        if (fetchedUserIds.length !== userIds.length) {
            return { error: "One or more users not found" };
        }


        const removedMembers = await chatMemberRepository.removeMembersFromChatInRepo(chatId, userIds);
        return { removedMembers, message: "Users removed successfully from the chat" };

    } catch (error) {
        console.error("Error removing members:", error);
        return { error: "An error occurred while removing members." };
    }
};


const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};