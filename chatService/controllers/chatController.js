import * as chatService from '../services/chatService.js';

const chatController = (app) => {
  app.post("/", async (req, res) => {
    const { currentUserId, userIds, chatType, name, description, visibility, scope, organization_id } = req.body;

    try {
      const result = await chatService.createChat(currentUserId, userIds, chatType, name, description, visibility, scope, organization_id);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  });

  app.get("/roles", async (req, res) => {
    try {
      const roles = await chatService.getAllRoles();
      res.status(200).json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "An error occurred while fetching roles." });
    }
  });

  app.get("/:userId", async (req, res) => {
    console.log(req.params);
    const { userId } = req.params;
    const { type } = req.query;
    try {
      if (!type || !userId) {
        return res.status(400).send({ error: "Missing required parameters" });
      }
      const chats = await chatService.getUserChatsByChatType(userId, type);
      res.send(chats);
    } catch (error) {
      console.error("Error fetching user chats:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });

  app.get("/:userId/all-chats", async (req, res) => {
    const { userId } = req.params;
    try {
      if (!userId) {
        return res.status(400).send({ error: "Missing required userId parameter" });
      }

      const chats = await chatService.getAllChatsWithUserDetails(userId);

      res.send(chats);
    } catch (error) {
      console.error("Error fetching all user chats:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });

  app.delete("/:chatId", async (req, res) => {
    const { chatId } = req.params;
    try {
      const result = await chatService.deleteChat(chatId);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  app.get("/:chatId/members", async (req, res) => {
    const { chatId } = req.params;
    try {
      const members = await chatService.getChatMembers(chatId);
      res.send(members);
    } catch (err) {
      console.error("Error fetching chat members:", err);
      res.status(500).send("Couldn't retrieve the members.");
    }
  });

  app.post("/:chatId/members", async (req, res) => {
    const { chatId } = req.params;
    const userIds = req.body;
    console.log(req.body);
    console.log(chatId + ' ' + userIds);
    try {
      const result = await chatService.addMembersToChat(chatId, userIds);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error occurred while adding members" });
    }
  });

  app.delete("/:chatId/members", async (req, res) => {
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

  app.post("/:chatId/permissions", async (req, res) => {
    const { chatId } = req.params;
    const permisions = req.body;
    console.log('cha permissions');
    try {
      const result = await chatService.updateRolePermissions(chatId, permisions);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating roles and permissions:", error);
      res.status(500).json({ error: "An error occurred while updating roles and permissions." });
    }
  });

  app.get("/:chatId/permissions", async (req, res) => {
    const { chatId } = req.params;
    try {
      const rolePermissions = await chatService.getAllRolePermissions(chatId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "An error occurred while fetching permissions." });
    }
  });

  app.get("/:chatId/permissions/:roleId", async (req, res) => {
    const { chatId, roleId } = req.params;
    try {
      const permissions = await chatService.getRolePermissions(chatId, roleId);
      res.status(200).send(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error occurred while fetching role permissions" });
    }
  });



  app.put("/:chatId/roles/:userId", async (req, res) => {
    const { chatId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).send({ error: "Role is required." });
    }

    try {
      console.log(role);
      const result = await chatService.updateUserRole(chatId, userId, role);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "An error occurred while updating the user role." });
    }
  });

  app.delete("/:chatId/leave/:userId", async (req, res) => {
    const { chatId, userId } = req.params;
    try {
      await chatService.leaveChat(chatId, userId);
      res.json({ message: "User successfully left the chat" });
    } catch (error) {
      console.error("Error leaving chat:", error);
      res.status(500).json({ message: "Failed to leave chat" });
    }
  });

  app.post("/:threadId/convert-to-group", async (req, res) => {
    const { threadId } = req.params;
    const { name, description, currentUserId, organization_id } = req.body;

    if (!name || !description || !currentUserId || !organization_id) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    try {
      const result = await chatService.convertThreadToGroup(threadId, name, description, currentUserId, organization_id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in converting thread to group:", error);
      res.status(500).json({ error: "Failed to convert thread to group." });
    }
  });
};

export default chatController;
