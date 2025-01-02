import * as organizationService from "../services/organizationService.js";
import authenticateToken from "../middlewares/authMiddleware.js";

const organizationController = (app) => {
  
  app.use(authenticateToken);

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

  app.get("/:orgName", async (req, res) => {
    try {
      const { orgName } = req.params;
      const organization = await organizationService.getOrganizationByName(orgName);
      if (organization) {
        return res.status(200).json({ organization });
      } else {
        return res.status(404).json({ message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      return res.status(500).json({
        message: "An error occurred while fetching the organization.",
        error: error.message,
      });
    }
  });
};

export default organizationController;
