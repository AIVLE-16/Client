// SocketContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [audioText, setAudioText] = useState('');
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('audio_text', (message) => {
      setAudioText(message);
    });

    newSocket.on('report3', (data) => {
      setLocation({ latitude: data.latitude, longitude: data.longitude });
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, audioText, location }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);