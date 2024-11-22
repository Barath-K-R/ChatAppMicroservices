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
};

export default threadController;

