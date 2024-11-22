import * as messageService from "../services/messageService.js";

export const messageController = (app) => {

  app.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { chatId, sender_id, message } = req.body;
      const result = await messageService.addingMessage(chatId, sender_id, message);
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
      const { userIds, date } = req.body;
      const result = await messageService.addReadReceipt(messageId, userIds, date);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while adding the read receipt." });
    }
  });
};
