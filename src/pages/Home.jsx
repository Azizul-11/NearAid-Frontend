// src/pages/Home.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../authContext/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { makeChatId } from "../utils/chat";
import { io } from "socket.io-client";

export default function Home() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [error, setError] = useState("");
  const [lastChat, setLastChat] = useState(() => localStorage.getItem("lastChat") || "");

  // Utility to fetch current geolocation with high accuracy
  const getCurrentLoc = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => setError("Unable to fetch precise location. Permission required."),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Watch geolocation continuously with high accuracy
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    const watcherId = navigator.geolocation.watchPosition(
      (pos) => {
        setError("");
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => setError("Unable to fetch precise location. Permission required."),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    // cleanup on unmount
    return () => navigator.geolocation.clearWatch(watcherId);
  }, []);

  // Whenever location updates, fetch nearby help requests within 10km
  useEffect(() => {
    if (!location) return;
    const fetchNearby = async () => {
      try {
        const res = await api.get(
          `/help/nearby?longitude=${location.longitude}&latitude=${location.latitude}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNearbyRequests(res.data);
      } catch {
        setError("Failed to load nearby requests.");
      }
    };
    fetchNearby();
  }, [location, token]);

  // Socket setup for real-time acceptance
  useEffect(() => {
    if (!token || !user?._id) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["polling", "websocket"],
      auth: { token },
    });

    socket.on("connect", () => socket.emit("joinRoom", user._id));
    socket.on("requestAccepted", ({ chatId }) => {
      localStorage.setItem("lastChat", chatId);
      setLastChat(chatId);
      navigate(`/chat/${chatId}`);
    });

    return () => socket.disconnect();
  }, [token, user?._id, navigate]);

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    try {
      await api.post(
        "/help",
        { description, coordinates: [location.longitude, location.latitude] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDescription("");
      // Refresh nearby list after posting
      getCurrentLoc();
    } catch {
      setError("Failed to post help request.");
    }
  };

  const handleAccept = async (requestId, requesterId) => {
    try {
      await api.put(
        `/help/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatId = makeChatId(user._id, requesterId);
      localStorage.setItem("lastChat", chatId);
      setLastChat(chatId);
      navigate(`/chat/${chatId}`);
    } catch {
      setError("Failed to accept request.");
    }
  };

  const openLastChat = () => lastChat && navigate(`/chat/${lastChat}`);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-orange-600">Hello, {user?.name}</h1>
        <div className="space-x-2 flex items-center">
          <Link
            to="/profile"
            className="text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
          >
            Profile
          </Link>
          <button
            onClick={openLastChat}
            disabled={!lastChat}
            className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Open Last Chat
          </button>
          <button
            onClick={() => logout(navigate)}
            className="text-red-500 hover:underline"
          >
            Logout
          </button>
          <button
            onClick={getCurrentLoc}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Location
          </button>
        </div>
      </header>

      <form onSubmit={handleHelpSubmit} className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-orange-600 mb-2">Need Help? Post Here:</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your situation..."
          className="w-full border p-2 rounded focus:outline-none focus:ring-orange-500"
          required
        />
        <button
          type="submit"
          className="mt-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Send Help Request
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-orange-600 mb-2">Nearby Help Requests (10 km)</h2>
        {nearbyRequests.length === 0 ? (
          <p className="text-gray-500">No requests found near you.</p>
        ) : (
          <ul className="space-y-3">
            {nearbyRequests.map((req) => (
              <li
                key={req._id}
                className="bg-white p-4 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{req.user.name}</p>
                  <p className="text-gray-700">{req.description}</p>
                </div>
                {req.user._id === user._id ? (
                  <span className="text-gray-500 italic flex items-center">
                    Waiting for someone to accept...
                  </span>
                ) : (
                  <button
                    onClick={() => handleAccept(req._id, req.user._id)}
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                  >
                    Help Now
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
