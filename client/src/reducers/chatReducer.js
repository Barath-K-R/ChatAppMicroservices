const initialState = {
  chatSelection: null,
  currentChat: null,
  chatPermissions: {
    admin: [],
    moderator: [],
    member: [],
  },
  currentUserRole: null,
  chatMembers: [],
  pinnedMessages: [],
};

export const chatReducer = (state = initialState, action) => {

  switch (action.type) {
    case "ADD_SELECTION":
      return {
        ...state,
        chatSelection: action.payload,
      };
    case "RESET":
      return {
        ...state,
        chatSelection: null,
        currentChat: null,
      };
    case "SET_CHAT_PERMISSIONS":
      return {
        ...state,
        chatPermissions: action.payload,
      };
    case "UPDATE_PERMISSIONS":
      const { role, updatedPermissions } = action.payload;
      return {
        ...state,
        chatPermissions: {
          ...state.chatPermissions,
          [role]: updatedPermissions,
        },
      };
    case "SET_CURRENT_USER_ROLE":
      return {
        ...state,
        currentUserRole: action.payload,
      };
    case "SET_CHAT_MEMBERS":
      return {
        ...state,
        chatMembers: action.payload,
      };
    case "SET_CURRENT_CHAT":
      return {
        ...state,
        currentChat: action.payload,
      };
    case "UPDATE_CURRENT_CHAT":
      return {
        ...state,
        currentChat: {
          ...state.currentChat,
          ...action.payload,
        },
      };
    case "RESET_CURRENT_CHAT":
      return {
        ...state,
        currentChat: null,
      };
      case "UPDATE_MEMBER_ROLE":
        const { userId, newRole } = action.payload;
        console.log(userId + " " + newRole);
      
        return {
          ...state,
          chatMembers: state.chatMembers.map((member) =>
            member.user_id === userId
              ? {
                  ...member,
                  role_id: newRole.id, 
                  Role: {
                    ...member.Role,
                    name: newRole, 
                  },
                }
              : member
          ),
        };
    case "PIN_MESSAGE":
      console.log(state.pinnedMessages);
      return {
        ...state,
        pinnedMessages: [action.payload, ...state.pinnedMessages],
      };

    case "UNPIN_MESSAGE":
      return {
        ...state,
        pinnedMessages: state.pinnedMessages.filter(
          (msg) => msg.id !== action.payload.id
        ),
      };

    case "RESET_PINNED_MESSAGES":
      return {
        ...state,
        pinnedMessages: [],
      };

    default:
      return state;
  }
};
