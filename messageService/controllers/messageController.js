import * as messageService from "../services/messageService.js";

export const messageController = (app) => {

  app.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { chatId, sender_id, message, thread_id, forwardedFromMessageId } = req.body;
      const result = await messageService.addingMessage(chatId, sender_id, message, thread_id, forwardedFromMessageId);
      res.send(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while adding the message." });
    }
  });

  app.get("/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const result = await messageService.getChatMessages(chatId);
      res.send(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching chat messages." });
    }
  });

  app.delete("/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const result = await messageService.deleteChatMessages(chatId);
      res.status(result ? 200 : 404).send(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while deleting chat messages." });
    }
  });

  app.get("/:messageId/reactions", async (req, res) => {
    try {
      const { messageId } = req.params;
      const result = await messageService.getReactions(messageId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching reactions." });
    }
  });

  app.post("/:messageId/reactions", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, reaction } = req.body;
      console.log(messageId + ' ' + userId + ' ' + reaction);
      const result = await messageService.addReaction(messageId, userId, reaction);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while adding the reaction." });
    }
  });

  app.delete("/:messageId/reactions/:reactionId", async (req, res) => {
    try {
      const { messageId, reactionId } = req.params;
      const result = await messageService.removeReaction(messageId, reactionId);
      res.status(result ? 200 : 404).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while removing the reaction." });
    }
  });

  app.get("/:chatId/unseen", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId } = req.query;
      const result = await messageService.getUnseenMessagesCount(chatId, userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching unseen messages count." });
    }
  });

  app.put("/read-receipts", async (req, res) => {
    try {
      const { messageIds, userId, date } = req.body;
      const result = await messageService.updateReadReceipts(messageIds, userId, date);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while updating read receipts." });
    }
  });

  app.post("/read-receipts/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      const userIds = req.body;

      const result = await messageService.createReadReceipt(messageId, userIds);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while adding the read receipt." });
    }
  });
};
