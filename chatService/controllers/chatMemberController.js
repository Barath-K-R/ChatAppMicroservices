import * as chatMemberService from '../services/chatMemberService.js';

const chatMemberController = (app) => {
  app.get("/:chatId/members", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const members = await chatMemberService.getChatMembers(chatId);
      res.send(members);
    } catch (error) {
      next(error);
    }
  });

  app.post("/:chatId/members", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const userIds = req.body;
      const result = await chatMemberService.addMembersToChat(chatId, userIds);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/:chatId/members", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const { userIds } = req.body;
      const result = await chatMemberService.removeMembersFromChat(chatId, userIds);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/:chatId/leave/:userId", async (req, res, next) => {
    try {
      const { chatId, userId } = req.params;
      await chatMemberService.leaveChat(chatId, userId);
      res.json({ message: "User successfully left the chat" });
    } catch (error) {
      next(error);
    }
  });
};

export default chatMemberController;
