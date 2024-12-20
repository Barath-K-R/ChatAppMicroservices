// useLogout.js
import { useSelector, useDispatch } from "react-redux";
import { userApi } from "../api/UserApi.js";

const useLogout = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.tokens.accessToken);
  const refreshToken = useSelector((state) => state.tokens.refreshToken);
  const authUser = useSelector((state) => state.user.authUser);
  const logout = async () => {
    try {
      await userApi.post("/logout", {userId:authUser.id});
      dispatch({
        type: "CLEAR_TOKENS",
      });

      dispatch({ type: "REMOVE_USER" });
      dispatch({ type: "RESET" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return logout;
};

export default useLogout;
