import axios from "axios";
import store from "../store/store.js";
import { userApi } from "./UserApi.js";

const chatApi = axios.create({ baseURL: "http://localhost:8000/chats" });

const getTokens = () => store.getState().tokens;

chatApi.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();

    if (accessToken) {
      // Set the Authorization header
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    // Handle errors before they reach the network
    return Promise.reject(error);
  }
);

chatApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("user routes error");

    const { refreshToken } = getTokens();

    const originalRequest = error.config;

    // Check if error status is 401 and if refresh token is available
    if (error.response && error.response.status === 403 && refreshToken) {
      try {
        // Request a new access token with the refresh token
        const response = await axios.post(
          "http://localhost:8000/users/refresh",
          { refreshToken: refreshToken }
        );

        const newAccessToken = response.data.accessToken;

        store.dispatch({
          type: "SET_TOKENS",
          payload: { accessToken: newAccessToken, refreshToken: refreshToken },
        });

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return chatApi(originalRequest);
      } catch (err) {
        console.error("Failed to refresh access token:", err);
        try {
          await userApi.post("/logout", null);
        } catch (logoutError) {
          console.error("Logout failed:", logoutError);
        }

        store.dispatch({ type: "CLEAR_TOKENS" });
        store.dispatch({ type: "REMOVE_USER" });
        store.dispatch({ type: "RESET" });
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const createChat = (chatData) => chatApi.post("/", chatData);
export const deleteChat=(chatId)=>chatApi.delete(`/${chatId}`)
export const leaveChat=(chatId,userId)=>chatApi.delete(`/${chatId}/leave/${userId}`)

export const userChats = (id, chatType) =>
  chatApi.get(`/${id}?type=${chatType}`);
export const retrieveMembers = (chatId) =>
  chatApi.get(`/${chatId}/members`);
export const addMembersToChat = (chatId, userIds) =>
  chatApi.post(`/${chatId}/members`, userIds);

export const removeMembersFromChat = (chatId, userIds) =>
  chatApi.delete(`/${chatId}/members`, {
    data: { userIds },
  });

export const addRolePermissions=(chatId,permissions)=>chatApi.post(`/${chatId}/permissions`,permissions)
export const getAllRolePermissions=(chatId)=>chatApi.get(`/${chatId}/permissions`);
export const getRolePermissions = (chatId, roleId) =>
  chatApi.get(`/${chatId}/permissions/${roleId}`);







