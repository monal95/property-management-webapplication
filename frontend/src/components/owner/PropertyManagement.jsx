import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Home,
  Users,
  DollarSign,
  Calendar,
  Star
}
  from 'lucide-react';
import api from '../../api';
import AddPropertyModal from './AddPropertyModal';
import EditPropertyModal from './EditPropertyModal';
import PropertyDetailsModal from './PropertyDetailsModal';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  // Fetch properties from backend
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      console.log('Fetching properties...');
      const response = await api.get('/properties/owner/my-properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Properties response status:', response.status);

      const data = response.data;
      console.log('Properties data:', data);
      setProperties(data.properties || []);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to load properties';
      console.error('Error fetching properties:', err?.response?.data || err);
      setError('Failed to load properties: ' + message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesStatus = filterStatus === 'all' || property.availability.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddProperty = async (propertyData) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('Sending property data to API:', propertyData);
      const response = await api.post('/properties', propertyData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response status:', response.status);

      const data = response.data;
      console.log('API Success response:', data);
      setProperties([data.property, ...properties]);
      setShowAddModal(false);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to create property';
      console.error('Error adding property:', err?.response?.data || err);
      setError(message);
    }
  };

  const handleEditProperty = async (propertyData) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.put(`/properties/${selectedProperty._id}`, propertyData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setProperties(properties.map(p => p._id === selectedProperty._id ? data.property : p));
      setShowEditModal(false);
      setSelectedProperty(null);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to update property';
      console.error('Error updating property:', err?.response?.data || err);
      setError(message);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        return;
      }

      await api.delete(`/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProperties(properties.filter(p => p._id !== propertyId));
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to delete property';
      console.error('Error deleting property:', err?.response?.data || err);
      setError(message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'apartment': return <Home className="h-4 w-4" />;
      case 'house': return <Home className="h-4 w-4" />;
      case 'villa': return <Home className="h-4 w-4" />;
      case 'commercial': return <Home className="h-4 w-4" />;
      default: return <Home className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
          <p className="text-gray-600">Manage your properties and track their performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Property
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
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rented</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.filter(p => p.availability.status === 'rented').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.filter(p => p.availability.status === 'available').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{properties
                  .filter(p => p.availability.status === 'rented')
                  .reduce((sum, p) => sum + (p.pricing.rent || 0), 0)
                  .toLocaleString()}
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
                placeholder="Search properties by title or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={property.images && property.images.length > 0 && property.images[0].url ? property.images[0].url : 'https://via.placeholder.com/400x300?text=No+Image'}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.availability.status)}`}>
                  {property.availability.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{property.rating?.average || 0}</span>
                </div>
              </div>

              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.address.city}, {property.address.state}</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-gray-600">
                  {getTypeIcon(property.type)}
                  <span className="text-sm capitalize">{property.type}</span>
                </div>
                {property.details.bedrooms && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-sm">{property.details.bedrooms} Beds</span>
                  </div>
                )}
                {property.details.bathrooms && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-sm">{property.details.bathrooms} Baths</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{(property.pricing.rent || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-medium text-gray-900">{property.views || 0}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProperty(property);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    setSelectedProperty(property);
                    setShowEditModal(true);
                  }}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProperty(property._id)}
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

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first property to see it here.</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProperty}
        />
      )}

      {showEditModal && selectedProperty && (
        <EditPropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProperty(null);
          }}
          onEdit={handleEditProperty}
        />
      )}

      {showDetailsModal && selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertyManagement;
