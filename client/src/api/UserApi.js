import axios from "axios";
import store from "../store/store.js";

export const userApi = axios.create({ baseURL: "http://localhost:8000/users" });

const getTokens = () => store.getState().tokens;

userApi.interceptors.request.use(
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

userApi.interceptors.response.use(
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

        return userApi(originalRequest);
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

export const getUser = (id) => userApi.get(`/${id}`);
export const getAllOrgUser = (orgId) => userApi.get(`/org/${orgId}`);

export const joinOrganization=(orgData)=>userApi.post('/join-org',orgData)
export const signUpUser=(formdata)=>userApi.post('/signup',formdata);
export const loginUser = (formdata) => userApi.post("/login", formdata);
