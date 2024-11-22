const initialState = {
  authUser: null,
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
      };
    default:
      return state;
  }
};
