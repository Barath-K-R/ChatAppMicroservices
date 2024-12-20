const initialState = {
    roles: {}, 
  };
  
const roleReducer = (state = initialState, action) => {
    switch (action.type) {
      case "SET_ROLES":
        return {
          ...state,
          roles: action.payload,
        };
  
      default:
        return state;
    }
  };
  
  export default roleReducer;
  