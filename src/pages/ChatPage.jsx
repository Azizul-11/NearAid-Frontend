// src/pages/ChatPage.jsx
import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext/AuthContext";
import { io } from "socket.io-client";
import api from "../utils/api";

// Build consistent chatId
function makeChatId(idA, idB) {
  return [idA, idB].sort((a, b) => a.localeCompare(b)).join("_");
}

export default function ChatPage() {
  const { user, token, logout } = useContext(AuthContext);
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();

  const [chatId, setChatId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sharing, setSharing] = useState(false);

  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Validate and normalize chatId
  useEffect(() => {
    if (!urlChatId || !user?._id) return;
    const [id1, id2] = urlChatId.split("_");
    const canonical = makeChatId(id1, id2);
    if (canonical !== urlChatId) {
      navigate(`/chat/${canonical}`, { replace: true });
      return;
    }
    setChatId(canonical);
    const other = user._id === id1 ? id2 : id1;
    setReceiverId(other);
    localStorage.setItem("lastChat", canonical);
  }, [urlChatId, user._id, navigate]);

  // Fetch receiver's name
  useEffect(() => {
    if (!receiverId) return;
    api
      .get(`/users/${receiverId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setReceiverName(res.data.name))
      .catch(() => setReceiverName("Unknown"));
  }, [receiverId, token]);

  // Initialize socket, online status, and location events
  useEffect(() => {
    if (!chatId) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["polling", "websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    // wait for connection before joining rooms
    socket.on("connect", () => {
      setSocketReady(true);
      socket.emit("joinRoom", user._id);
      socket.emit("joinRoom", chatId);
    });("connect", () => setSocketReady(true));
    socket.on("onlineUsers", (ids) => setOnlineUsers(ids));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("receiveLocation", (locMsg) => setMessages((prev) => [...prev, locMsg]));
    socket.on("disconnect", () => setSocketReady(false));

    return () => socket.disconnect();
  }, [chatId, token, user._id]);

  // Load chat history
  useEffect(() => {
    if (!chatId) return;
    api
      .get(`/messages/${chatId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMessages(res.data))
      .catch(() => {});
  }, [chatId, token]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a text message
  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !socketReady) return;
    const payload = { chatId, sender: user._id, receiver: receiverId, text: trimmed, timestamp: new Date().toISOString(), type: 'text' };
    socketRef.current.emit("sendMessage", payload);
    setText("");
  };

  // Share current location
  const shareLocation = () => {
    if (!socketReady || sharing) return;
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const payload = { chatId, sender: user._id, receiver: receiverId, latitude, longitude, timestamp: new Date().toISOString(), type: 'location' };
        socketRef.current.emit("shareLocation", payload);
        setSharing(false);
      },
      () => {
        alert("Unable to fetch location");
        setSharing(false);
      }
    );
  };

  const isReceiverOnline = onlineUsers.includes(receiverId);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-md">
        <button onClick={() => navigate('/home')} className="text-orange-600 hover:underline">
          ← Home
        </button>
        <div className="flex items-center space-x-2">
          <span className={`h-3 w-3 rounded-full ${isReceiverOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <h2 className="text-lg font-semibold text-gray-800">
            Chat with {receiverName || receiverId}
          </h2>
        </div>
        <button onClick={() => logout(navigate)} className="text-red-500 hover:underline">
          Logout
        </button>
      </header>

      <div ref={chatBoxRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender === user._id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg space-y-1 ${isMine ? 'bg-orange-600 text-white' : 'bg-white text-gray-800 shadow-md'}`}>
                  {msg.type === 'location' ? (
                    <>
                      <a
                        href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        📍 Shared Location
                      </a>
                      <span className="block text-xs text-gray-400 text-right">{time}</span>
                    </>
                  ) : (
                    <>
                      <p>{msg.text}</p>
                      <span className="block text-xs text-gray-400 text-right">{time}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white px-6 py-4 flex items-center border-t space-x-2">
        <button
          onClick={shareLocation}
          disabled={!socketReady || sharing}
          className={`px-4 py-2 rounded ${sharing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          {sharing ? 'Sharing...' : 'Share Location'}
        </button>
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || !socketReady}
          className={`px-5 py-2 rounded-r-lg text-white ${text.trim() && socketReady ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
