import jwt from 'jsonwebtoken';
import * as userRepository from '../datasbase/repositories/userRepository.js';
import { publishMessage, createChannel } from '../utils/index.js';
import axios from 'axios'
export const addUser = async ({ username, email, password }) => {
  try {
    const newUser = await userRepository.createUser({ username, email, password });
    return newUser;
  } catch (error) {
    console.error("Error adding user:", error);
    throw new Error("An error occurred while adding the user.");
  }
};

export const getUserById = async (id) => {
  try {
    const user = await userRepository.findByUserId(id);
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("An error occurred while fetching the user.");
  }
};

export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    const users = await userRepository.findByUserIds(userIds);
    return users;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    throw new Error("An error occurred while fetching users.");
  }
};

export const getAllOrgUsers = async (orgId) => {
  try {
    const users = await userRepository.findUsersByOrganizationId(orgId);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("An error occurred while fetching users.");
  }
};


export const joinOrganization = async (userId, orgName) => {
  try {
    if (!orgName || !userId) {
      throw { status: 400, message: "Invalid input: orgName and userId are required" };
    }
    let organization;
  
    try {
      const response = await axios.get(`http://localhost:8000/organization/${orgName}`);

      if (response.status === 200 && response.data.organization) {
        organization = response.data.organization;
      } else {
        throw { status: 404, message: "Organization not found" };
      }
    } catch (error) {
      console.log(error);
      throw { status: 500, message: "Error fetching organization details" };
    }

    const user = await userRepository.findByUserId(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    await userRepository.updateUserOrganization(userId, organization.id)

    const updatedUser = await userRepository.findByUserId(userId);

    return updatedUser;

  } catch (error) {
    console.error("Error joining organization:", error);
    throw error;
  }
};


export const updateUserOrganization = async (userId, organizationId) => {
  try {
    if (!userId || !organizationId) {
      throw new Error("User ID and Organization ID are required");
    }

    const updatedUser = await userRepository.updateUserOrganization(userId, organizationId);

    return { message: "User's organization updated successfully", updatedUser };
  } catch (error) {
    console.error("Error updating user's organization:", error);
    throw new Error("An error occurred while updating the user's organization.");
  }
};

export const login = async ({ identifier, password }) => {
  try {
    const user = await userRepository.findUserByIdentifier(identifier);
    if (!user) throw new Error("User not found");

    const isMatch = user.password === password;
    if (!isMatch) throw new Error("Password not matched");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userRepository.saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  } catch (error) {
    console.error("Error during login:", error);
    throw new Error("An error occurred during login.");
  }
};

export const logout = async (userId) => {
  try {
    await userRepository.deleteRefreshTokenByUserId(userId);
    return { message: "Successfully logged out" };
  } catch (error) {
    console.error("Error during logout:", error);
    throw new Error("An error occurred during logout.");
  }
};

export const createAccessToken = async (refreshToken) => {
  try {
    if (!refreshToken) throw new Error("You are not authenticated!");

    const dbRefreshToken = await userRepository.findRefreshToken(refreshToken);
    if (!dbRefreshToken) throw new Error("Refresh token is not valid!");

    const newAccessToken = await new Promise((resolve, reject) => {
      jwt.verify(refreshToken, "mySecretKey", (err, user) => {
        if (err) {
          reject(new Error("Refresh token is not valid!"));
        } else {
          const token = generateAccessToken(user);
          resolve(token);
        }
      });
    });
    return newAccessToken;
  } catch (error) {
    console.error("Error creating access token:", error);
    throw new Error("An error occurred while creating a new access token.");
  }
};

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, "mySecretKey", {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "1d",
  });
};

export const subscribeEvents = async (msg) => {
  try {
    if (msg && msg.content) {
      const messageContent = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      switch (routingKey) {
        case 'fetch_user_details':
          const userIds = messageContent;
          if (userIds && Array.isArray(userIds)) {
            const userDetails = await getUsersByIds(userIds);
            const { replyTo, correlationId } = msg.properties;

            const channel = await createChannel();

            if (replyTo && correlationId) {
              channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(userDetails)), {
                correlationId,
              });
              console.log(`Sent user details to ${replyTo}`);
            } else {
              console.log("ReplyTo queue or correlationId is missing.");
            }
          } else {
            console.log("No userIds provided in message content.");
          }
          break;

        case 'update_user_organization':
          const { userId, organizationId } = messageContent;
          if (userId && organizationId) {
            await updateUserOrganization(userId, organizationId);
            console.log(`User ${userId} updated with organization ${organizationId}`);
          } else {
            console.log("Invalid message content for updating user organization.");
          }
          break;
        default:
          console.log(`Unhandled routing key: ${routingKey}`);
      }
    }
  } catch (error) {
    console.error("Error handling event:", error);
  }
};

const generateUuid = () => {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
};

