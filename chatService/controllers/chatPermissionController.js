import * as chatPermissionService from '../services/chatPermissionService.js';

const chatPermissionController = (app) => {
  app.post("/:chatId/permissions", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const permissions = req.body;
      const result = await chatPermissionService.updateRolePermissions(chatId, permissions);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:chatId/permissions", async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const rolePermissions = await chatPermissionService.getAllRolePermissions(chatId);
      res.json(rolePermissions);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:chatId/permissions/:roleId", async (req, res, next) => {
    try {
      const { chatId, roleId } = req.params;
      const permissions = await chatPermissionService.getRolePermissions(chatId, roleId);
      res.status(200).send(permissions);
    } catch (error) {
      next(error);
    }
  });
};

export default chatPermissionController;
