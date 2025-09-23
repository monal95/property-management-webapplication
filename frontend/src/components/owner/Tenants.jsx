import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  Users,
  Building,
  Briefcase,
  Calendar
} from 'lucide-react';
import api from '../../api';
import AddTenantModal from './AddTenantModal';
import EditTenantModal from './EditTenantModal';
import TenantDetailsModal from './TenantDetailsModal';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  // Fetch tenants and properties from backend
  useEffect(() => {
    fetchTenants();
    fetchProperties();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.get('/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setTenants(data.tenants || []);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to fetch tenants';
      console.error('Error fetching tenants:', err?.response?.data || err);
      setError('Failed to load tenants: ' + message);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await api.get('/properties/owner/my-properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleAddTenant = async (tenantData) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      // Use the new assign-by-email endpoint
      const response = await api.post('/tenants/assign-by-email', {
        ...tenantData,
        propertyId: tenantData.assignedProperty,
        tenantEmail: tenantData.email,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setTenants([data.tenant, ...tenants]);
      setShowAddModal(false);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to assign tenant to property';
      console.error('Error adding tenant:', err?.response?.data || err);
      setError(message);
    }
  };

  const handleEditTenant = async (tenantData) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.put(`/tenants/${selectedTenant._id}`, tenantData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setTenants(tenants.map(t => t._id === selectedTenant._id ? data.tenant : t));
      setShowEditModal(false);
      setSelectedTenant(null);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to update tenant';
      console.error('Error updating tenant:', err?.response?.data || err);
      setError(message);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      await api.delete(`/tenants/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTenants(tenants.filter(t => t._id !== tenantId));
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to delete tenant';
      console.error('Error deleting tenant:', err?.response?.data || err);
      setError(message);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-gray-600">Manage your tenants and their property assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Tenant
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Occupied Properties</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.assignedProperty).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <div key={tenant._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm">{tenant.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{tenant.email}</span>
                </div>
                {tenant.assignedProperty && (
                  <div className="flex items-center text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{tenant.assignedProperty.title}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTenant(tenant);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    setSelectedTenant(tenant);
                    setShowEditModal(true);
                  }}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTenant(tenant._id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first tenant to see them here.</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddTenantModal
          properties={properties}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTenant}
        />
      )}

      {showEditModal && selectedTenant && (
        <EditTenantModal
          tenant={selectedTenant}
          properties={properties}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTenant(null);
          }}
          onEdit={handleEditTenant}
        />
      )}

      {showDetailsModal && selectedTenant && (
        <TenantDetailsModal
          tenant={selectedTenant}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTenant(null);
          }}
        />
      )}
    </div>
  );
};

export default Tenants;


