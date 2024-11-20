import * as organizationService from "../services/organizationService.js";

const organizationController = (app) => {
  app.post("/", async (req, res) => {
    try {
      const { name, userId } = req.body;
      const newOrganization = await organizationService.createOrganization(name, userId);
      return res.status(201).json(newOrganization);
    } catch (error) {
      console.error("Error creating organization:", error);
      return res.status(500).json({
        message: "An error occurred while creating the organization.",
        error: error.message,
      });
    }
  });
};

export default organizationController;
