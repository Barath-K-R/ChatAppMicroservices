import * as organizationService from "../services/organizationService.js";

const organizationController = (app) => {
  app.post("/", async (req, res) => {
    try {
      const { orgName, userId } = req.body;
      const newOrganization = await organizationService.createOrganization(orgName, userId);
      return res.status(201).json({message:"new organization created successfully",organization_id:newOrganization.id});
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
