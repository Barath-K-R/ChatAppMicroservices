import React, { useState } from "react";
import { loginUser } from "../api/UserApi.js";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {useDispatch } from 'react-redux';
const Auth = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const dispatch = useDispatch();
  const {login,setUser}=useAuth();
  const navigate=useNavigate()

  const dispatchUser=(user)=>{
      dispatch({type:'ADD_USER',payload:user})
  }

  const dispatchTokens=(tokens)=>{
    dispatch({type:'SET_TOKENS',payload:tokens})
  }

  const handleChange = (e) => {
    setFormData((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  //subitting 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData);
      console.log(response.data);
      dispatch({type:'ADD_USER',payload:response.data.user});
      dispatchUser(response.data.user);
      dispatchTokens({
        accessToken:response.data.accessToken,
        refreshToken:response.data.refreshToken
      });
      navigate('/');
    } catch (error) {
        console.log(error);
    }
  };

  return (
    <div className="flex items-start justify-center pt-14 w-full bg-gray-100">
      <div className="flex flex-col gap-4 h-5/6 w-2/6 bg-orange-400">
        <section className="flex flex-col ml-8 mt-20">
          <label htmlFor="username">UserName</label>
          <input
            type="text"
            name="username"
            className="w-3/6"
            onChange={handleChange}
          />
        </section>
        <section className="flex flex-col ml-8">
          <label htmlFor="password">Password</label>
          <input
            type="text"
            name="password"
            className="w-3/6"
            onChange={handleChange}
          />
        </section>
        <button className="ml-14 h-8 w-2/6 rounded-xl bg-blue-400" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Auth;
