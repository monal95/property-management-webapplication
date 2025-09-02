import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Users, Briefcase, Building, Calendar } from 'lucide-react';

const EditTenantModal = ({ tenant, properties, onClose, onEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        familyMembers: '',
        occupation: '',
        assignedProperty: '',
        status: 'pending',
        moveInDate: '',
        leaseStartDate: '',
        leaseEndDate: '',
        rentAmount: '',
        depositAmount: '',
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        }
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Initialize form data when tenant prop changes
    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
                phone: tenant.phone || '',
                email: tenant.email || '',
                familyMembers: tenant.familyMembers || '',
                occupation: tenant.occupation || '',
                assignedProperty: tenant.assignedProperty?._id || tenant.assignedProperty || '',
                status: tenant.status || 'pending',
                moveInDate: tenant.moveInDate ? tenant.moveInDate.split('T')[0] : '',
                leaseStartDate: tenant.leaseStartDate ? tenant.leaseStartDate.split('T')[0] : '',
                leaseEndDate: tenant.leaseEndDate ? tenant.leaseEndDate.split('T')[0] : '',
                rentAmount: tenant.rentAmount || '',
                depositAmount: tenant.depositAmount || '',
                emergencyContact: {
                    name: tenant.emergencyContact?.name || '',
                    phone: tenant.emergencyContact?.phone || '',
                    relationship: tenant.emergencyContact?.relationship || ''
                }
            });
        }
    }, [tenant]);

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Tenant name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.familyMembers) newErrors.familyMembers = 'Number of family members is required';
        if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
        if (!formData.assignedProperty) newErrors.assignedProperty = 'Please assign a property';
        if (!formData.moveInDate) newErrors.moveInDate = 'Move-in date is required';
        if (!formData.leaseStartDate) newErrors.leaseStartDate = 'Lease start date is required';
        if (!formData.leaseEndDate) newErrors.leaseEndDate = 'Lease end date is required';
        if (!formData.rentAmount) newErrors.rentAmount = 'Rent amount is required';
        if (!formData.depositAmount) newErrors.depositAmount = 'Deposit amount is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Format the data properly for the backend
            const formattedData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                familyMembers: parseInt(formData.familyMembers),
                occupation: formData.occupation,
                assignedProperty: formData.assignedProperty,
                status: formData.status,
                moveInDate: new Date(formData.moveInDate).toISOString(),
                leaseStartDate: new Date(formData.leaseStartDate).toISOString(),
                leaseEndDate: new Date(formData.leaseEndDate).toISOString(),
                rentAmount: parseFloat(formData.rentAmount),
                depositAmount: parseFloat(formData.depositAmount),
                emergencyContact: {
                    name: formData.emergencyContact.name || '',
                    phone: formData.emergencyContact.phone || '',
                    relationship: formData.emergencyContact.relationship || ''
                }
            };

            console.log('Updating tenant data:', formattedData);
            await onEdit(formattedData);
        } catch (error) {
            console.error('Error updating tenant:', error);
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Tenant</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tenant Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., John Doe"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., +919876543210"
                                />
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., john@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Family Members *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.familyMembers}
                                    onChange={(e) => handleInputChange('familyMembers', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.familyMembers ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., 4"
                                />
                                {errors.familyMembers && <p className="text-red-500 text-sm mt-1">{errors.familyMembers}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Occupation/Job *
                                </label>
                                <input
                                    type="text"
                                    value={formData.occupation}
                                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.occupation ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., Software Engineer"
                                />
                                {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Property Assignment */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Property Assignment
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Property *
                            </label>
                            <select
                                value={formData.assignedProperty}
                                onChange={(e) => handleInputChange('assignedProperty', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.assignedProperty ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select a property</option>
                                {properties.map(property => (
                                    <option key={property._id} value={property._id}>
                                        {property.title} - {property.address.city}
                                    </option>
                                ))}
                            </select>
                            {errors.assignedProperty && <p className="text-red-500 text-sm mt-1">{errors.assignedProperty}</p>}
                        </div>
                    </div>

                    {/* Lease Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Lease Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Move-in Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.moveInDate}
                                    onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.moveInDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.moveInDate && <p className="text-red-500 text-sm mt-1">{errors.moveInDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lease Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.leaseStartDate}
                                    onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.leaseStartDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.leaseStartDate && <p className="text-red-500 text-sm mt-1">{errors.leaseStartDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lease End Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.leaseEndDate}
                                    onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.leaseEndDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.leaseEndDate && <p className="text-red-500 text-sm mt-1">{errors.leaseEndDate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Financial Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monthly Rent (₹) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.rentAmount}
                                    onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.rentAmount ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., 25000"
                                />
                                {errors.rentAmount && <p className="text-red-500 text-sm mt-1">{errors.rentAmount}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Security Deposit (₹) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.depositAmount}
                                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.depositAmount ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., 50000"
                                />
                                {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.emergencyContact.name}
                                    onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.emergencyContact.phone}
                                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., +919876543210"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Relationship
                                </label>
                                <input
                                    type="text"
                                    value={formData.emergencyContact.relationship}
                                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Spouse"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Updating...' : 'Update Tenant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTenantModal;
