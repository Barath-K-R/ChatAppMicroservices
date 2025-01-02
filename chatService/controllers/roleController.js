import * as roleService from '../services/roleService.js';

const roleController = (app) => {

  app.get("/allroles", async (req, res, next) => {
    console.log('getting all roles');
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  });

  app.put("/:chatId/roles/:userId", async (req, res, next) => {
    try {
      const { chatId, userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).send({ error: "Role is required." });
      }

      const result = await roleService.updateUserRole(chatId, userId, role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });
};

export default roleController;
