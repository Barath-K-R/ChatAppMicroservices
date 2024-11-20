import ThreadModel from "../models/threadModel.js";
import ThreadMembersModel from "../models/threadMembersModel.js";

export const createThread = async (chatId, head) => {
    try {
        const thread = await ThreadModel.create({
            chat_id: chatId,
            head,
        });

        return thread;
    } catch (error) {
        console.error("Error creating thread:", error);
        throw error;
    }
};

export const addMembersToThread = async (thread_id, userIds) => {
    try {
        const threadMembers = userIds.map((user_id) => ({
            thread_id,
            user_id,
        }));

        await ThreadMembersModel.bulkCreate(threadMembers);
    } catch (error) {
        console.error("Error adding members to thread:", error);
        throw error;
    }
};

export const getThreadMembersByThreadId = async (threadId) => {
    try {
        const threadMembers = await ThreadMembersModel.findAll({
            where: { thread_id: threadId },
            attributes: ["user_id"],
        });
        return threadMembers;
    } catch (error) {
        console.error("Error fetching thread members:", error);
        throw error;
    }
};

export const deleteThread = async (threadId) => {
    try {
        await ThreadMembersModel.destroy({
            where: { thread_id: threadId },
        });

        await ThreadModel.destroy({
            where: { id: threadId },
        });

        return { message: "Thread and related data have been deleted successfully." };
    } catch (error) {
        console.error("Error deleting thread:", error);
        throw error;
    }
};
