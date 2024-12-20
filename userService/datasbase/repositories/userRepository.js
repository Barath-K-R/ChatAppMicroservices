import UserModel from "../models/userModel.js";
import RefreshTokenModel from '../models/refreshTokenModel.js'
import { Op } from "sequelize"; 

export const createUser = async (userData) => {
  try {
    return await UserModel.create(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const findByUserId = async (id) => {
  console.log('userid='+id);
  try {
    return await UserModel.findByPk(id);
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

export const findByUserIds = async (userIds) => {
  try {
    const users = await UserModel.findAll({
      where: {
        id: userIds
      },
      attributes:['id','username']
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

const getOrganizationByName = async (orgName) => {
  try {
   
    const organization = await OrganizationModel.findOne({
      where: { name: orgName },
    });

    return organization; 
  } catch (error) {
    console.error("Error fetching organization by name:", error);
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


export const findUserByIdentifier = async (identifier) => {
  try {
    return await UserModel.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
  } catch (error) {
    console.error("Error finding user by identifier (username or email):", error);
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