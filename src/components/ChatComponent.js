// ChatComponent.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const ChatComponent = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io.connect('http://localhost:3000');

        socketRef.current.on('message', message => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const sendMessage = () => {
        socketRef.current.emit('message', input);
        setInput('');
    };

    return (
        <div>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => (e.key === 'Enter' ? sendMessage() : null)}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatComponent;
