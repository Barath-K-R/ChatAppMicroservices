import * as threadService from "../services/threadService.js";

const threadController = (app) => {

  app.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { chatId, sender_id, head, userIds, message } = req.body;
      const response = await threadService.createThread(chatId, sender_id, head, userIds, message);
      return res.status(201).json(response);
    } catch (error) {
      console.error("Error in createThread controller:", error);
      return res.status(500).json({ error: "Failed to create thread." });
    }
  });

  app.post("/message", async (req, res) => {
    try {
      const { thread_id, sender_id, message, chatId } = req.body;
      const response = await threadService.addMessageToThread(thread_id, sender_id, message, chatId);
      return res.status(201).json(response);
    } catch (error) {
      console.error("Error in addMessageToThread controller:", error);
      return res.status(500).json({ error: "Failed to add message to thread." });
    }
  });

  app.post("/:threadId", async (req, res) => {
    const { threadId } = req.params
    try {
      const { name, description, currentUserId } = req.body;
      const response = await threadService.convertThreadToChat(threadId, name, description, currentUserId);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in convertThreadToChat controller:", error);
      return res.status(500).json({ error: "Failed to convert thread to chat." });
    }
  });

  app.get("/:threadId/members", async (req, res) => {
    const { threadId } = req.params;
    try {
      const response = await threadService.getThreadMembers(threadId);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in getThreadMembers controller:", error);
      return res.status(500).json({ error: "Failed to fetch thread members." });
    }
  });

  app.post("/:threadId/members", async (req, res) => {
    const { threadId } = req.params; 
    const { userIds } = req.body;    


    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds should be a non-empty array." });
    }

    try {
  
      const response = await threadService.addMembersToThread(threadId, userIds);
      return res.status(201).json(response);
    } catch (error) {
      console.error("Error in addMembersToThread controller:", error);
      return res.status(500).json({ error: "Failed to add members to thread." });
    }
  });

  app.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const response = await threadService.getThreadsByUser(userId);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in getThreadsByUser controller:", error);
      return res.status(500).json({ error: "Failed to fetch threads for user." });
    }
  });
};

export default threadController;

