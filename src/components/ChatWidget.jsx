// src/components/ChatWidget.jsx
import { useEffect, useState, useRef, useContext } from "react";
import { AuthContext } from "../authContext/AuthContext";
import { io } from "socket.io-client";
import api from "../utils/api";

export default function ChatWidget({ chatId, onClose }) {
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    // fetch history
    (async () => {
      try {
        const res = await api.get(`/messages/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    })();

    // init socket
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL, { transports: ["polling", "websocket"], auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("joinRoom", chatId));
    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socket.disconnect();
  }, [chatId, token]);

  // scroll
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current.emit("sendMessage", { chatId, sender: user._id, receiver: null, text });
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-white shadow-lg rounded flex flex-col">
      <div className="flex justify-between items-center bg-blue-600 text-white p-2 rounded-t">
        <span>Chat</span>
        <button onClick={onClose} className="font-bold">✕</button>
      </div>
      <div ref={boxRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map(msg => (
          <div
            key={msg._id}
            className={`p-2 rounded max-w-xs ${msg.sender === user._id ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-2 flex">
        <input
          className="flex-1 border rounded-l px-2"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type..."
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 rounded-r">Send</button>
      </div>
    </div>
  );
}
