import { combineReducers } from 'redux';
import { userReducer } from './userReducer';
import tokenReducer from './tokenReducer';
import { chatSelectionReducer } from './chatSelectionReducer';
const rootReducer = combineReducers({
  user: userReducer,
  selection: chatSelectionReducer,
  tokens:tokenReducer
});

export default rootReducer;
