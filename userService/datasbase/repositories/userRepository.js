import UserModel from "../models/userModel.js";
import RefreshTokenModel from '../models/refreshTokenModel.js'

export const createUser = async (userData) => {
  try {
    return await UserModel.create(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    return await UserModel.findByPk(id);
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

export const findUsersByIds = async (userIds) => {
  try {
    const users = await UserModel.findAll({
      where: {
        id: userIds
      }
    });
    return users;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    throw error; 
  }
};

export const findUsersByOrganizationId = async (organizationId) => {
  try {
    return await UserModel.findAll({ where: { organization_id: organizationId } });
  } catch (error) {
    console.error("Error finding users by organization id:", error);
    throw error;
  }
};

export const updateUserOrganization = async (userId, organizationId) => {
  try {
    return await UserModel.update(
      { organization_id: organizationId },
      { where: { id: userId } }
    );
  } catch (error) {
    console.error("Error updating user organization:", error);
    throw error;
  }
};


export const findUserByUsername = async (username) => {
  try {
      return await UserModel.findOne({ where: { username } });
  } catch (error) {
      console.error("Error finding user by username:", error);
      throw error; 
  }
};

export const saveRefreshToken = async (userId, refreshToken) => {
  try {
      return await RefreshTokenModel.create({
          user_id: userId,
          refresh_token: refreshToken,
      });
  } catch (error) {
      console.error("Error saving refresh token:", error);
      throw error;
  }
};

export const findRefreshToken = async (refreshToken) => {
  try {
      return await RefreshTokenModel.findOne({
          where: { refresh_token: refreshToken },
      });
  } catch (error) {
      console.error("Error finding refresh token:", error);
      throw error;
  }
};

export const deleteRefreshTokenByUserId = async (userId) => {
  try {
      return await RefreshTokenModel.destroy({ where: { user_id: userId } });
  } catch (error) {
      console.error("Error deleting refresh token by user ID:", error);
      throw error;
  }
};