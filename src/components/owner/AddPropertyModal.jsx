import React, { useState } from 'react';
import { X, Upload, MapPin, Home, DollarSign, Calendar } from 'lucide-react';

const AddPropertyModal = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'apartment',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
        },
        details: {
            bedrooms: '',
            bathrooms: '',
            area: '',
            areaUnit: 'sqft',
            parking: '',
            furnished: false
        },
        amenities: [],
        pricing: {
            rent: '',
            deposit: '',
            utilities: '',
            currency: 'INR'
        },
        availability: {
            status: 'available',
            availableFrom: '',
            leaseTerm: '',
            leaseTermUnit: 'months'
        },
        images: []
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const amenitiesList = [
        'wifi', 'ac', 'heating', 'kitchen', 'laundry', 'gym',
        'pool', 'garden', 'balcony', 'elevator', 'security', 'parking'
    ];

    const propertyTypes = [
        { value: 'apartment', label: 'Apartment' },
        { value: 'house', label: 'House' },
        { value: 'villa', label: 'Villa' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'land', label: 'Land' }
    ];

    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

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

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setErrors({ submit: 'Please select valid image files' });
            return;
        }

        // Convert images to base64 for preview and storage
        const imagePromises = imageFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        url: e.target.result,
                        caption: file.name,
                        isPrimary: formData.images.length === 0 // First image is primary
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises).then(newImages => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
            }));
            setErrors({}); // Clear any previous errors
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const setPrimaryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                isPrimary: i === index
            }))
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state.trim()) newErrors.state = 'State is required';
        if (!formData.address.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        if (!formData.pricing.rent) newErrors.rent = 'Rent amount is required';
        if (formData.pricing.rent && formData.pricing.rent <= 0) newErrors.rent = 'Rent must be greater than 0';

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
                title: formData.title,
                description: formData.description,
                type: formData.type,
                address: {
                    street: formData.address.street,
                    city: formData.address.city,
                    state: formData.address.state,
                    zipCode: formData.address.zipCode,
                    country: formData.address.country
                },
                details: {
                    bedrooms: formData.details.bedrooms ? parseInt(formData.details.bedrooms) : 0,
                    bathrooms: formData.details.bathrooms ? parseInt(formData.details.bathrooms) : 0,
                    area: formData.details.area ? parseFloat(formData.details.area) : 0,
                    areaUnit: formData.details.areaUnit,
                    parking: formData.details.parking ? parseInt(formData.details.parking) : 0,
                    furnished: formData.details.furnished
                },
                amenities: formData.amenities,
                pricing: {
                    rent: parseFloat(formData.pricing.rent),
                    deposit: formData.pricing.deposit ? parseFloat(formData.pricing.deposit) : 0,
                    utilities: formData.pricing.utilities ? parseFloat(formData.pricing.utilities) : 0,
                    currency: formData.pricing.currency
                },
                availability: {
                    status: formData.availability.status,
                    availableFrom: formData.availability.availableFrom,
                    leaseTerm: formData.availability.leaseTerm ? parseInt(formData.availability.leaseTerm) : 12,
                    leaseTermUnit: formData.availability.leaseTermUnit
                },
                images: formData.images
            };

            console.log('Submitting property data:', formattedData);
            console.log('Raw form data:', formData);
            console.log('Description value:', formData.description);
            console.log('Description length:', formData.description.length);

            // Call the parent component's onAdd function which will handle the API call
            await onAdd(formattedData);
        } catch (error) {
            console.error('Error adding property:', error);
            // Show error to user
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
                    <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
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
                            <Home className="h-5 w-5" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.title ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., Modern 2BHK Apartment"
                                />
                                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Type *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                                >
                                    {propertyTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.description ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Describe your property..."
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            <p className={`text-xs mt-1 ${formData.description.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                                {formData.description.length}/10 characters minimum
                            </p>
                        </div>
                    </div>

                    {/* Property Images */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Property Images
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Images
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">
                                        Click to upload images or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, JPEG up to 5MB each
                                    </p>
                                </label>
                            </div>
                        </div>

                        {/* Image Preview */}
                        {formData.images.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Uploaded Images</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image.url}
                                                alt={image.caption}
                                                className={`w-full h-24 object-cover rounded-lg border-2 ${image.isPrimary ? 'border-black' : 'border-gray-200'
                                                    }`}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrimaryImage(index)}
                                                        className={`p-1 rounded ${image.isPrimary
                                                            ? 'bg-black text-white'
                                                            : 'bg-white text-gray-700 hover:bg-black hover:text-white'
                                                            }`}
                                                        title={image.isPrimary ? 'Primary Image' : 'Set as Primary'}
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="p-1 rounded bg-black text-white hover:bg-gray-800"
                                                        title="Remove Image"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            {image.isPrimary && (
                                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                    Primary
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    First image will be set as primary. Click the star icon to change primary image.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Address
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    value={formData.address.street}
                                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.street ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., 123 Main Street"
                                />
                                {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    value={formData.address.city}
                                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., Mumbai"
                                />
                                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State *
                                </label>
                                <select
                                    value={formData.address.state}
                                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.state ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select State</option>
                                    {states.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ZIP Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.address.zipCode}
                                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.zipCode ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., 400001"
                                />
                                {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bedrooms
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.details.bedrooms}
                                    onChange={(e) => handleInputChange('details.bedrooms', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bathrooms
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.details.bathrooms}
                                    onChange={(e) => handleInputChange('details.bathrooms', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Area
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.details.area}
                                        onChange={(e) => handleInputChange('details.area', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="1200"
                                    />
                                    <select
                                        value={formData.details.areaUnit}
                                        onChange={(e) => handleInputChange('details.areaUnit', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="sqft">sqft</option>
                                        <option value="sqm">sqm</option>
                                        <option value="acres">acres</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parking Spaces
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.details.parking}
                                    onChange={(e) => handleInputChange('details.parking', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1"
                                />
                            </div>

                            <div className="flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    id="furnished"
                                    checked={formData.details.furnished}
                                    onChange={(e) => handleInputChange('details.furnished', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="furnished" className="ml-2 block text-sm text-gray-900">
                                    Furnished
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {amenitiesList.map(amenity => (
                                <label key={amenity} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => handleAmenityToggle(amenity)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 capitalize">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Pricing
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monthly Rent (₹) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.rent}
                                    onChange={(e) => handleInputChange('pricing.rent', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.rent ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="25000"
                                />
                                {errors.rent && <p className="text-red-500 text-sm mt-1">{errors.rent}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Security Deposit (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.deposit}
                                    onChange={(e) => handleInputChange('pricing.deposit', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="50000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Utilities (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.utilities}
                                    onChange={(e) => handleInputChange('pricing.utilities', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="2000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Availability
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.availability.status}
                                    onChange={(e) => handleInputChange('availability.status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="available">Available</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="reserved">Reserved</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Available From
                                </label>
                                <input
                                    type="date"
                                    value={formData.availability.availableFrom}
                                    onChange={(e) => handleInputChange('availability.availableFrom', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lease Term
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.availability.leaseTerm}
                                        onChange={(e) => handleInputChange('availability.leaseTerm', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="12"
                                    />
                                    <select
                                        value={formData.availability.leaseTermUnit}
                                        onChange={(e) => handleInputChange('availability.leaseTermUnit', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
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
                            {loading ? 'Adding...' : 'Add Property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertyModal;
