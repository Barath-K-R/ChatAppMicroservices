import * as chatService from '../services/chatService.js';

const chatController = (app) => {
  app.post("/", async (req, res, next) => {
    try {
      const { currentUserId, userIds, chatType, name, description, visibility, scope, organization_id } = req.body;
      const result = await chatService.createChat(currentUserId, userIds, chatType, name, description, visibility, scope, organization_id);
      res.send(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      if (!type || !userId) {
        return res.status(400).send({ error: "Missing required parameters" });
      }

      const chats = await chatService.getUserChatsByChatType(userId, type);
      res.send(chats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:userId/all", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const chats = await chatService.getAllChatsWithUserDetails(userId);
      res.send(chats);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/:chatId", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const result = await chatService.deleteChat(chatId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });
};

export default chatController;
