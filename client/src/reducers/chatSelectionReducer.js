const initialState = {
  selection: null,
};

export const chatSelectionReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_SELECTION":
      localStorage.setItem("selection", JSON.stringify(action.payload));
      return {
        ...state,
        selection: action.payload,
      };
    case "RESET":
      localStorage.removeItem("selection");
      return {
        ...state,
        selection: null,
      };
    default:
      return state;
  }
};
