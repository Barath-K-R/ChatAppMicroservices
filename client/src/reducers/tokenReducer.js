const initialState = {
  accessToken: null,
  refreshToken: null,
};

const tokenReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_TOKENS":
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    case "CLEAR_TOKENS":
      return {
        ...state,
        accessToken: null,
        refreshToken: null,
      };
    default:
      return state;
  }
};

export default tokenReducer;
