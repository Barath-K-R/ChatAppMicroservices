import * as chatService from '../services/chatService.js';

const chatController = (app) => {
  app.post("/chat", async (req, res) => {
    const { currentUserId, userIds, chatType, name, description, visibility, scope } = req.body;
    try {
      const result = await chatService.createChat(currentUserId, userIds, chatType, name, description, visibility, scope);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  });

  app.get("/chat/:userId", async (req, res) => {
    console.log(req.params);
    const { userId } = req.params;
    const { type } = req.query;
    try {
      if (!type || !userId) {
        return res.status(400).send({ error: "Missing required parameters" });
      }
      const chats = await chatService.getCurrentUserChats(userId, type);
      res.send(chats);
    } catch (error) {
      console.error("Error fetching user chats:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });

  app.delete("/chat/:chatId", async (req, res) => {
    const { chatId } = req.params;
    try {
      const result = await chatService.deleteChat(chatId);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  app.get("/chat/:chatId/members", async (req, res) => {
    const { chatId } = req.params;
    try {
      const members = await chatService.getChatMembers(chatId);
      res.send(members);
    } catch (err) {
      console.error("Error fetching chat members:", err);
      res.status(500).send("Couldn't retrieve the members.");
    }
  });

  app.post("/chat/:chatId/members", async (req, res) => {
    const { chatId } = req.params;
    const { userIds } = req.body;
    try {
      const result = await chatService.addMembersToChat(chatId, userIds);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error occurred while adding members" });
    }
  });

  app.delete("/chat/:chatId/members", async (req, res) => {
    const { chatId } = req.params;
    const { userIds } = req.body;
    try {
      const result = await chatService.removeMembersFromChat(chatId, userIds);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error occurred while removing members" });
    }
  });

  app.post("/chat/:chatId/permissions", async (req, res) => {
    const { chatId } = req.params;
    const {roles }= req.body;
    try {
      const result = await chatService.addRolePermissions(chatId, roles);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating roles and permissions:", error);
      res.status(500).json({ error: "An error occurred while updating roles and permissions." });
    }
  });

  app.get("/chat/:chatId/permissions", async (req, res) => {
    const { chatId } = req.params;
    try {
      const rolePermissions = await chatService.getAllRolePermissions(chatId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "An error occurred while fetching permissions." });
    }
  });

  app.get("/chat/:chatId/permissions/:roleId", async (req, res) => {
    const { chatId, roleId } = req.params;
    try {
      const permissions = await chatService.getRolePermissions(chatId, roleId);
      res.status(200).send(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error occurred while fetching role permissions" });
    }
  });

  app.delete("/chat/:chatId/leave/:userId", async (req, res) => {
    const { chatId, userId } = req.params;
    try {
      await chatService.leaveChat(chatId, userId);
      res.json({ message: "User successfully left the chat" });
    } catch (error) {
      console.error("Error leaving chat:", error);
      res.status(500).json({ message: "Failed to leave chat" });
    }
  });
};

export default chatController;
