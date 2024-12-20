const initialState = {
  isForwardMessageModalOpened: false,
  forwardedMessage: null,
};

export const forwardMessageReducer = (state = initialState, action) => {
  switch (action.type) {
    case "OPEN_FORWARD_MESSAGE_MODAL":
      return {
        ...state,
        isForwardMessageModalOpened: true,
      };
    case "CLOSE_FORWARD_MESSAGE_MODAL":
      return {
        ...state,
        isForwardMessageModalOpened: false,
      };
    case "SET_FORWARDED_MESSAGE":
      return {
        ...state,
        forwardedMessage: action.payload || null,
      };
    case "RESET_FORWARDED_MESSAGE":
      return {
        ...state,
        forwardedMessage: null,
      };
    default:
      return state;
  }
};
