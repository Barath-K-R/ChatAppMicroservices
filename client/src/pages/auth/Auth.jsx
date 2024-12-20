import React, { useState } from "react";
import { loginUser,signUpUser} from "../../api/UserApi.js";
import { useAuth } from "../../context/AuthContext.js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
const Auth = () => {
  const [formData, setFormData] = useState({ identifier: "", email: "", password: "" });
  const [isSignup, setIsSignup] = useState(false);
  const dispatch = useDispatch();
  const { login, setUser } = useAuth();
  const navigate = useNavigate()

  const dispatchUser = (user) => {
    dispatch({ type: 'ADD_USER', payload: user })
  }

  const dispatchTokens = (tokens) => {
    dispatch({ type: 'SET_TOKENS', payload: tokens })
  }

  const resetFormData=()=>{
    setFormData({ identifier: "", email: "", password: "" })
  }
  const handleChange = (e) => {
    setFormData((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        // Handle Signup
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match!");
          return;
        }
        const signupData = {
          email: formData.email,
          password: formData.password,
        };
        const response = await signUpUser(signupData);
        console.log("Signup successful:", response.data);
        setIsSignup(false);
        resetFormData();
      } else {
       
        const loginData = {
          identifier: formData.identifier, 
          password: formData.password,
        };
        const response = await loginUser(loginData);
        console.log("Login successful:", response.data);
        dispatchUser(response.data.user);
        dispatchTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-start justify-center pt-14 w-full h-full bg-gray-100">
      <div className="flex flex-col gap-4 h-5/6 w-2/6 bg-orange-400">
        <h2 className="text-center mt-4 text-lg font-bold">
          {isSignup ? "Sign Up" : "Log In"}
        </h2>

        {isSignup ? (
          <section className="flex flex-col ml-8 mt-20">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              className="w-3/6"
              onChange={handleChange}
              value={formData.email}
              placeholder="Enter your email"
            />
          </section>
        ) : (
          <section className="flex flex-col ml-8 mt-20">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              name="identifier"
              className="w-3/6"
              onChange={handleChange}
              value={formData.identifier}
              placeholder="Email or Username"
            />
          </section>
        )}

        <section className="flex flex-col ml-8">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            className="w-3/6"
            onChange={handleChange}
            value={formData.password}
            placeholder="Enter your password"
          />
        </section>

        {isSignup && (
          <section className="flex flex-col ml-8">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-3/6"
              onChange={handleChange}
              value={formData.confirmPassword}
              placeholder="Confirm your password"
            />
          </section>
        )}

        <button className="ml-14 h-8 w-2/6 rounded-xl bg-blue-400" onClick={handleSubmit}>
          {isSignup ? "Sign Up" : "Log In"}
        </button>
        <p className="text-center mt-4">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => {
              setIsSignup((prev) => !prev);
              setFormData({ identifier: "", email: "", password: "", confirmPassword: "" }); // Reset form on toggle
            }}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;