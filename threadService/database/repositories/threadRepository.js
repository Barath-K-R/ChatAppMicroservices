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
            include: [
                {
                    model: ThreadModel,
                    attributes: ["id", "chat_id"], 
                }
            ],
            attributes: ["user_id"],
        });
        return threadMembers;
    } catch (error) {
        console.error("Error fetching thread members from DB:", error);
        throw error;
    }
};

export const deleteThreadById = async (threadId) => {
    try {
        const result = await ThreadModel.destroy({
            where: { id: threadId },
        });

        return result > 0; 
    } catch (error) {
        console.error("Error in deleteThreadById repository:", error);
        throw new Error("Database error while deleting thread.");
    }
};

export const findThreadsByUserId = async (userId) => {
    try {
      const threads = await ThreadMembersModel.findAll({
        where: { user_id: userId },
        attributes: ["thread_id"],
      });
      return threads;
    } catch (error) {
      throw new Error("Error fetching threads from database: " + error.message);
    }
  };

  export const getThreadById = async (threadId) => {
    try {
        const thread = await ThreadModel.findOne({
            where: { id: threadId },
        });

        if (!thread) {
            throw new Error(`Thread with id ${threadId} not found.`);
        }

        return thread;
    } catch (error) {
        console.error("Error fetching thread by ID:", error);
        throw error;
    }
};
