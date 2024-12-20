import * as userService from "../services/userService.js";


const UserController = (app) => {

  app.get("/ids", async (req, res) => {
    console.log('finding userids');
    const { userIds } = req.body;
    try {
      const users = await userService.getUsersByIds(userIds);
      if (users.length === 0) {
        return res.status(404).json({ message: "No users found with the provided IDs" });
      }
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users by IDs:", error);
      res.status(500).json({ message: "An error occurred while fetching users" });
    }
  });

  app.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const user = await userService.getUserById(id);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        message: "An error occurred while fetching the user.",
        error: error.message,
      });
    }
  });



  app.get("/org/:orgId", async (req, res) => {
    const { orgId } = req.params;
    try {
      const users = await userService.getAllOrgUsers(orgId);
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        message: "An error occurred while fetching users.",
        error: error.message,
      });
    }
  });

  app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const username = email.split('@')[0]; 
      const newUser = await userService.addUser({ username, email, password });
      res.status(201).json({
        message: "User signed up successfully",
        user: newUser,
      });
    } catch (error) {
      console.error("Error signing up user:", error);
      res.status(500).json({
        message: "An error occurred during signup.",
        error: error.message,
      });
    }
  });

  app.post("/login", async (req, res) => {
    const { identifier, password } = req.body;
    try {
      const result = await userService.login({ identifier, password });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "An error occurred during login." });
    }
  });

  app.post("/logout", async (req, res) => {
    console.log(req.body);
    const { userId } = req.body;
    try {
      const result = await userService.logout(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "An error occurred during logout." });
    }
  });

  app.post("/refresh", async (req, res) => {
    console.log('refreshing');
    const { refreshToken } = req.body;
    try {
      const result = await userService.createAccessToken(refreshToken);
      res.status(200).json({ accessToken: result });
    } catch (error) {
      console.error("Error creating access token:", error);
      res.status(500).json({ message: "An error occurred while creating a new access token." });
    }
  });

  app.post("/join-org", async (req, res) => {
    const { userId, orgName } = req.body;
    console.log(userId+' '+orgName);
    try {
      const updatedUser = await userService.joinOrganization(userId, orgName);
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error joining organization:", error);
  
      res.status(error.status || 500).json({
        message: error.message || "An unexpected error occurred",
      });
    }
  });
};

export default UserController;
