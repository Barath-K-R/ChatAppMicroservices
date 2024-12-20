import { combineReducers } from 'redux';
import { userReducer } from './userReducer';
import tokenReducer from './tokenReducer';
import {chatReducer} from './chatReducer.js'
import { forwardMessageReducer } from './forwardMessageReducer.js';
import roleReducer from './roleReducer.js';

const rootReducer = combineReducers({
  user: userReducer,
  chats: chatReducer,
  forwardMessage:forwardMessageReducer,
  tokens:tokenReducer,
  userRoles:roleReducer
});

export default rootReducer;
