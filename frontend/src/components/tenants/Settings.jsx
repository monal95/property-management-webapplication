import React, { useState } from "react";
// ✅ Import all icons you actually use
import {
  MdAccountCircle,
  MdSettings,
  MdPrivacyTip,
  MdHelp,
  MdInfo,
  MdLogout,
  MdNotifications,
  MdEmail,
  MdChevronRight,
} from "react-icons/md";

// ❌ Remove useNavigate since you're not using real Router navigation
// import { useNavigate } from "react-router-dom";

export default function Settings({ onBack }) {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      onBack?.();
    }
  };

  const settingsOptions = [
    {
      title: "Profile",
      icon: <MdAccountCircle size={24} className="text-blue-600" />,
      onClick: () => alert("Profile settings coming soon"),
    },
    {
      title: "Account",
      icon: <MdSettings size={24} className="text-blue-600" />,
      onClick: () => alert("Account settings coming soon"),
    },
    {
      title: "Privacy",
      icon: <MdPrivacyTip size={24} className="text-blue-600" />,
      onClick: () => alert("Privacy settings coming soon"),
    },
    {
      title: "Support",
      icon: <MdHelp size={24} className="text-blue-600" />,
      onClick: () => alert("Contact support: support@propertyapp.com"),
    },
    {
      title: "About",
      icon: <MdInfo size={24} className="text-blue-600" />,
      onClick: () => alert("Property Management App v1.0.0"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-5 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Scrollable Content */}
      <div className="p-5 space-y-8">
        {/* Notifications */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Notifications</h2>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-3">
            <div className="flex items-center space-x-3">
              <MdNotifications size={24} className="text-blue-600" />
              <div>
                <p className="text-gray-900 font-medium">Push Notifications</p>
                <p className="text-gray-500 text-sm">Get notified about important updates</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <MdEmail size={24} className="text-blue-600" />
              <div>
                <p className="text-gray-900 font-medium">Email Alerts</p>
                <p className="text-gray-500 text-sm">Receive emails for rent payments and maintenance</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={() => setEmailAlerts(!emailAlerts)}
              className="w-5 h-5"
            />
          </div>
        </div>

        {/* General */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">General</h2>
          {settingsOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.onClick}
              className="flex items-center justify-between w-full bg-white p-4 rounded-xl shadow-sm mb-3 text-left"
            >
              <div className="flex items-center space-x-3">
                {option.icon}
                <span className="text-gray-900 font-medium">{option.title}</span>
              </div>
              <MdChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full bg-red-50 border border-red-200 p-4 rounded-xl"
          >
            <MdLogout size={24} className="text-red-600" />
            <span className="ml-2 text-red-600 font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
