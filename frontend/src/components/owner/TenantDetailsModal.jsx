import React from 'react';
import { X, User, Phone, Mail, Users, Briefcase, Building, Calendar, MapPin, DollarSign } from 'lucide-react';

const TenantDetailsModal = ({ tenant, onClose }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Tenant Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Tenant Name</label>
                                    <p className="text-lg font-semibold text-gray-900">{tenant.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                                    <p className="text-lg text-gray-900 flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {tenant.phone}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                    <p className="text-lg text-gray-900 flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {tenant.email}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Status</label>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenant.status)}`}>
                                        {tenant.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Family Members</label>
                                    <p className="text-lg text-gray-900 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        {tenant.familyMembers} members
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Occupation</label>
                                    <p className="text-lg text-gray-900 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        {tenant.occupation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Property Assignment */}
                    {tenant.assignedProperty && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Assigned Property
                            </h3>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Property Name</label>
                                        <p className="text-lg font-semibold text-gray-900">{tenant.assignedProperty.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Property Type</label>
                                        <p className="text-lg text-gray-900 capitalize">{tenant.assignedProperty.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Address</label>
                                        <p className="text-lg text-gray-900 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {tenant.assignedProperty.address.street}, {tenant.assignedProperty.address.city}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Monthly Rent</label>
                                        <p className="text-lg text-gray-900 flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            ₹{tenant.assignedProperty.pricing.rent?.toLocaleString() || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lease Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Lease Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Move-in Date</label>
                                <p className="text-lg text-gray-900">{formatDate(tenant.moveInDate)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Lease Start Date</label>
                                <p className="text-lg text-gray-900">{formatDate(tenant.leaseStartDate)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Lease End Date</label>
                                <p className="text-lg text-gray-900">{formatDate(tenant.leaseEndDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Monthly Rent</label>
                                <p className="text-2xl font-bold text-gray-900">₹{tenant.rentAmount?.toLocaleString() || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Security Deposit</label>
                                <p className="text-2xl font-bold text-gray-900">₹{tenant.depositAmount?.toLocaleString() || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    {tenant.emergencyContact && (tenant.emergencyContact.name || tenant.emergencyContact.phone) && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                                        <p className="text-lg text-gray-900">{tenant.emergencyContact.name || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                                        <p className="text-lg text-gray-900 flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            {tenant.emergencyContact.phone || 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Relationship</label>
                                        <p className="text-lg text-gray-900">{tenant.emergencyContact.relationship || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Created On</label>
                                <p className="text-lg text-gray-900">{formatDate(tenant.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                                <p className="text-lg text-gray-900">{formatDate(tenant.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantDetailsModal;
