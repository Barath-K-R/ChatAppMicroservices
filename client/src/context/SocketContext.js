import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:8800');
    console.log('SOCKET INITIALIZED');
    setSocket(socketInstance);


    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    socket ? (
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    ) : (
      <div>Loading...</div>
    )
  );
};
