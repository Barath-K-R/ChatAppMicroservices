import { useSelector } from 'react-redux';

export const useToken=()=>{
    const accessToken=useSelector(state=>state.tokens.accessToken);
    const refreshToken=useSelector(state=>state.tokens.refreshToken);

    return {accessToken,refreshToken};
}