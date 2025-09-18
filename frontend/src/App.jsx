import React, { useState, useEffect } from 'react';
import {
  Home, Building, User, Wallet, Wrench, Settings,
  Menu, X, ChevronRight, Users, LogOut
} from 'lucide-react';
import PropertyManagement from './components/owner/PropertyManagement.jsx';
import OwnerPayments from './components/owner/Payments.jsx';
import OwnerTenants from './components/owner/Tenants.jsx';
import OwnerMaintenance from './components/owner/Maintenance.jsx';
import OwnerSettings from './components/owner/Settings.jsx';
import TenantPayments from './components/tenants/Payments.jsx';
import TenantComplaints from './components/tenants/Complaints.jsx';
import TenantSettings from './components/tenants/Settings.jsx';
import TenantMyProperty from './components/tenants/MyProperty.jsx';
import RoleSelection from './components/Auth/RoleSelection.jsx';
import Login from './components/Auth/Login.jsx';
import Signup from './components/Auth/Signup.jsx';

// Dashboard Component with Sidebar Navigation
const Dashboard = ({ role, onLogout }) => {
  const storedName = localStorage.getItem('userName') || 'User';
  const firstName = storedName.split(' ')[0];
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const [activeTab, setActiveTab] = useState(role === 'owner' ? 'properties' : 'my-property');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ownerMenuItems = [
    { id: 'properties', label: 'Properties', icon: Building, description: 'Manage your properties' },
    { id: 'tenants', label: 'Tenants', icon: Users, description: 'View current tenants' },
    { id: 'payments', label: 'Payments', icon: Wallet, description: 'Track rent payments' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Handle maintenance requests' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account preferences' },
  ];

  const tenantMenuItems = [
    { id: 'my-property', label: 'My Property', icon: Building, description: 'View your rental property' },
    { id: 'payments', label: 'Pay Rent', icon: Wallet, description: 'Make rent payments' },
    { id: 'complaints', label: 'Complaints', icon: Wrench, description: 'Submit maintenance requests' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account preferences' },
  ];

  const menuItems = role === 'owner' ? ownerMenuItems : tenantMenuItems;

  const renderContent = () => {
    if (role === 'owner') {
      switch (activeTab) {
        case 'properties': return <PropertyManagement />;
        case 'tenants': return <OwnerTenants />;
        case 'payments': return <OwnerPayments />;
        case 'maintenance': return <OwnerMaintenance />;
        case 'settings': return <OwnerSettings />;
        default: return <PropertyManagement />;
      }
    } else {
      switch (activeTab) {
        case 'my-property': return <TenantMyProperty />;
        case 'payments': return <TenantPayments />;
        case 'complaints': return <TenantComplaints />;
        case 'settings': return <TenantSettings />;
        default: return <TenantMyProperty />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white shadow-xl transition-all duration-300 flex flex-col fixed h-full z-50 border-r border-gray-200`}>
        {/* Sidebar Header - Logo and Brand */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center">
                <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-gray-900">Renti</span><span className="text-yellow-500">fy</span>
                  </h1>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    Smart Property Management
                  </p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto shadow-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-yellow-100 transition-colors active:scale-[0.98] text-gray-600"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            {sidebarOpen && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Navigation
              </h3>
            )}
          </div>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98] group ${isActive
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200'
                      : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <Icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-yellow-600'
                      }`} />
                    {sidebarOpen && (
                      <>
                        <div className="flex-1 text-left">
                          <span className="font-medium">{item.label}</span>
                          <p className="text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.description}
                          </p>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onLogout}
            className={`w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-[0.98] font-medium ${sidebarOpen ? '' : 'justify-center'
              }`}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
            {sidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}! 👋</h2>
              <p className="text-gray-600 mt-2 text-lg">
                {role === 'owner'
                  ? 'Manage your properties and tenants efficiently'
                  : 'Access your rental property and manage payments'
                }
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                <p className="text-sm text-yellow-600 font-medium">
                  {role === 'owner' ? 'Property Owner' : 'Tenant'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('role-selection');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing login on app start
  useEffect(() => {
    const checkExistingLogin = () => {
      try {
        const isLoggedIn = localStorage.getItem('loggedIn');
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');
        
        if (isLoggedIn === 'true' && role && token) {
          console.log('Found existing login session');
          setSelectedRole(role);
          setCurrentView('dashboard');
        } else {
          console.log('No existing login session found');
          setCurrentView('role-selection');
        }
      } catch (error) {
        console.error('Error checking existing login:', error);
        setCurrentView('role-selection');
      } finally {
        setIsLoading(false);
      }
    };

    // Check after splash screen
    const timer = setTimeout(() => {
      setShowSplash(false);
      checkExistingLogin();
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Store role in localStorage
    localStorage.setItem('role', role);
    setCurrentView('login');
  };

  const handleLogin = () => {
    console.log('Login successful, navigating to dashboard');
    setCurrentView('dashboard');
  };

  const handleSignup = () => {
    console.log('Signup successful, navigating to dashboard');
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    try {
      // Clear all stored login data
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      console.log('Logout successful, cleared all stored data');
      
      setSelectedRole(null);
      setCurrentView('role-selection');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const renderCurrentView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl font-extrabold mb-4">
              <span className="text-black">Renti</span><span className="text-yellow-500">fy</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'role-selection':
        return <RoleSelection onRoleSelect={handleRoleSelect} />;
      case 'login':
        return (
          <Login
            onLogin={handleLogin}
            onGoToSignup={() => setCurrentView('signup')}
          />
        );
      case 'signup':
        return (
          <Signup
            onSignup={handleSignup}
            onGoToLogin={() => setCurrentView('login')}
          />
        );
      case 'dashboard':
        return <Dashboard role={selectedRole} onLogout={handleLogout} />;
      default:
        return <RoleSelection onRoleSelect={handleRoleSelect} />;
    }
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-5xl sm:text-6xl font-extrabold animate-pulse">
          <span className="text-black">Renti</span><span className="text-yellow-500">fy</span>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen">{renderCurrentView()}</div>;
}