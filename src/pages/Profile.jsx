// src/pages/Profile.jsx
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../authContext/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Profile() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current profile
  useEffect(() => {
    api
      .get("/users/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setForm({ name: res.data.name, email: res.data.email }))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(
        "/users/profile",
        { name: form.name, email: form.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Profile updated successfully!");
      // Optionally update localStorage user
      const stored = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, name: res.data.name, email: res.data.email })
      );
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">My Profile</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 rounded text-white ${
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => logout(navigate)}
            className="text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}
