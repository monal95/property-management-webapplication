import React from "react";
import { Home, Building, User } from "lucide-react";

export default function RoleSelection({ onRoleSelect }) {
  const selectRole = async (role) => {
    localStorage.setItem("role", role);
    onRoleSelect(role);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100 mb-4 animate-pulse">
            <Building className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-4xl font-extrabold">
            <span className="text-black">Renti</span>
            <span className="text-yellow-500">fy</span>
          </h2>
          <p className="mt-2 text-gray-600">Please select your role to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => selectRole("owner")}
            className="w-full bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-yellow-400 group active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <Building className="h-10 w-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Property Owner</h3>
              <p className="text-gray-600">Manage your properties and tenants</p>
            </div>
          </button>

          <button
            onClick={() => selectRole("tenant")}
            className="w-full bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-yellow-400 group active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <User className="h-10 w-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tenant</h3>
              <p className="text-gray-600">View properties and send complaints</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}