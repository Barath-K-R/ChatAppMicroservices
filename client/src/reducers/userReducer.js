const initialState = {
  authUser: null,
  chats: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_USER":
      localStorage.setItem("authuser", JSON.stringify(action.payload));
      return {
        ...state,
        authUser: action.payload,
      };

    case "REMOVE_USER":
      localStorage.removeItem("authuser");
      return {
        ...state,
        authUser: null,
        chats: null,
      };

    case "SET_USER_CHATS":
      return {
        ...state,
        chats: action.payload,
      };

    case "CLEAR_USER_CHATS":
      return {
        ...state,
        chats: null,
      };
    case "UPDATE_USER_ORG":
      const updatedUser = {
        ...state.authUser,
        organization_id: action.payload, 
      };
      return {
        ...state,
        authUser: updatedUser,
      };
    default:
      return state;
  }
};
