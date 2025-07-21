import { useContext } from 'react';
import Hero from "../assets/Hero.png";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { token, loading } = useContext(AuthContext);

  const handlePrimary = () => {
    token ? navigate('/home') : navigate('/register');
  };

  // Show loading state to prevent flickering
  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="bg-orange-600 rounded p-2">
            <span className="text-white text-xl">🚨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mr-5">HelpMe</h1>
        </div>
        <nav className="flex items-center gap-8">
          {!token ? (
            <>
              <button onClick={() => navigate('/login')} className="text-orange-600 hover:underline">Login</button>
              <button onClick={() => navigate('/register')} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Sign Up</button>
            </>
          ) : (
            <button onClick={() => navigate('/home')} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Dashboard</button>
          )}
        </nav>
      </header>

      <section className="flex-1 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto p-6">
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-4xl font-extrabold text-gray-900">Get Help from People Nearby</h2>
          <p className="text-lg text-gray-600">A social app for helping each other in real life emergencies.</p>
          <button onClick={handlePrimary} className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition">{token ? 'Request Help' : 'Get Started'}</button>
        </div>
        <div className="md:w-1/2 mt-6 md:mt-0">
          <img src={Hero} alt="Person requesting help" className="w-full h-auto" />
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h3 className="text-3xl font-semibold text-gray-900">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '👤', title: 'Sign Up', desc: 'Create an account to get started' },
              { icon: '❗', title: 'Request Help', desc: 'Send an alert when you need assistance' },
              { icon: '🤝', title: 'Get Assistance', desc: 'Receive help from nearby users' },
            ].map((step, i) => (
              <div className="space-y-4" key={i}>
                <div className="mx-auto bg-orange-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-orange-500 text-2xl">{step.icon}</span>
                </div>
                <h4 className="text-xl font-medium">{step.title}</h4>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
