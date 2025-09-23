import React, { useState, useEffect } from 'react';
import { Home, MapPin, Calendar, Users, Building, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';

const TenantMyProperty = () => {
	const [property, setProperty] = useState(null);
	const [tenantInfo, setTenantInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	useEffect(() => {
		fetchMyProperty();
	}, []);

	const fetchMyProperty = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				setError('Authentication required');
				setLoading(false);
				return;
			}

			// First, let's debug the user
			console.log('Fetching debug info...');
			const debugResponse = await api.get('/tenants/debug-user', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (debugResponse.status === 200) {
				const debugData = debugResponse.data;
				console.log('Debug data:', debugData);
			}

			const response = await api.get('/tenants/my-property', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 404) {
				setError('No property assigned to you yet. Please contact your landlord.');
				setLoading(false);
				return;
			}

			const data = response.data;
			setProperty(data.property);
			setTenantInfo(data.tenantInfo);
			setLoading(false);
		} catch (err) {
			const message = err?.response?.data?.message || err.message || 'Failed to fetch property details';
			console.error('Error fetching property:', err?.response?.data || err);
			setError(message);
			setLoading(false);
		}
	};

	const nextImage = () => {
		if (property.images && property.images.length > 0) {
			setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
		}
	};

	const prevImage = () => {
		if (property.images && property.images.length > 0) {
			setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
		}
	};

	const hasImages = property?.images && property.images.length > 0;
	const currentImage = hasImages ? property.images[currentImageIndex] : null;

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">My Property</h2>
				<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			</div>
		);
	}

	if (!property) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">My Property</h2>
				<div className="text-center py-12">
					<Home className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900">No property assigned</h3>
					<p className="mt-1 text-sm text-gray-500">Contact your landlord to get assigned to a property.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">My Property</h2>

			{/* Property Images */}
			{hasImages && (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="relative h-64 md:h-80">
						<img
							src={currentImage.url}
							alt={currentImage.caption || property.title}
							className="w-full h-full object-cover"
						/>
						{/* Navigation Arrows */}
						{property.images.length > 1 && (
							<>
								<button
									onClick={prevImage}
									className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
								>
									<ChevronLeft className="h-5 w-5" />
								</button>
								<button
									onClick={nextImage}
									className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
								>
									<ChevronRight className="h-5 w-5" />
								</button>
							</>
						)}
						{/* Image Counter */}
						<div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
							{currentImageIndex + 1} / {property.images.length}
						</div>
					</div>

					{/* Thumbnail Navigation */}
					{property.images.length > 1 && (
						<div className="p-4 border-t">
							<div className="flex gap-2 overflow-x-auto">
								{property.images.map((image, index) => (
									<button
										key={index}
										onClick={() => setCurrentImageIndex(index)}
										className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
											}`}
									>
										<img
											src={image.url}
											alt={image.caption || `Image ${index + 1}`}
											className="w-full h-full object-cover"
										/>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Property Details */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<div className="text-xl font-semibold text-gray-900 flex items-center gap-2">
							<Home className="h-5 w-5 text-blue-600" /> {property.title}
						</div>
						<div className="text-gray-600 mt-1 flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							{property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}
						</div>
					</div>
					<div className="text-right">
						<div className="text-sm text-gray-600">Monthly Rent</div>
						<div className="text-2xl font-bold text-gray-900">₹{property.pricing.rent.toLocaleString()}</div>
					</div>
				</div>

				{/* Property Description */}
				{property.description && (
					<div className="mb-6 p-4 bg-gray-50 rounded-lg">
						<h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
						<p className="text-gray-900">{property.description}</p>
					</div>
				)}

				{/* Property Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="text-sm text-gray-600">Type</div>
						<div className="text-lg font-semibold capitalize">{property.type}</div>
					</div>
					{property.details.bedrooms && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Bedrooms</div>
							<div className="text-lg font-semibold">{property.details.bedrooms}</div>
						</div>
					)}
					{property.details.bathrooms && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Bathrooms</div>
							<div className="text-lg font-semibold">{property.details.bathrooms}</div>
						</div>
					)}
					{property.details.area && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Area</div>
							<div className="text-lg font-semibold">{property.details.area} {property.details.areaUnit}</div>
						</div>
					)}
					{property.details.parking && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Parking</div>
							<div className="text-lg font-semibold">{property.details.parking} spots</div>
						</div>
					)}
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="text-sm text-gray-600">Status</div>
						<div className="text-lg font-semibold capitalize">{property.availability.status}</div>
					</div>
				</div>

				{/* Amenities */}
				{property.amenities && property.amenities.length > 0 && (
					<div className="mb-6">
						<h3 className="text-sm font-medium text-gray-700 mb-3">Amenities</h3>
						<div className="flex flex-wrap gap-2">
							{property.amenities.map((amenity, index) => (
								<span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
									{amenity}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Tenant Information */}
				{tenantInfo && (
					<div className="border-t pt-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Users className="h-5 w-5" /> My Lease Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="text-sm text-gray-600">Move-in Date</div>
								<div className="font-semibold">{formatDate(tenantInfo.moveInDate)}</div>
							</div>
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="text-sm text-gray-600">Lease Start</div>
								<div className="font-semibold">{formatDate(tenantInfo.leaseStartDate)}</div>
							</div>
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="text-sm text-gray-600">Lease End</div>
								<div className="font-semibold">{formatDate(tenantInfo.leaseEndDate)}</div>
							</div>
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="text-sm text-gray-600">Deposit Amount</div>
								<div className="font-semibold">₹{tenantInfo.depositAmount.toLocaleString()}</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default TenantMyProperty;



