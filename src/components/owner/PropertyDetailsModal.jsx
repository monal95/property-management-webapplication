import React, { useState } from 'react';
import { X, MapPin, Home, Users, Calendar, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';

const PropertyDetailsModal = ({ property, onClose }) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	if (!property) return null;
	const p = property;

	const nextImage = () => {
		if (p.images && p.images.length > 0) {
			setCurrentImageIndex((prev) => (prev + 1) % p.images.length);
		}
	};

	const prevImage = () => {
		if (p.images && p.images.length > 0) {
			setCurrentImageIndex((prev) => (prev - 1 + p.images.length) % p.images.length);
		}
	};

	const hasImages = p.images && p.images.length > 0;
	const currentImage = hasImages ? p.images[currentImageIndex] : null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
				</div>
				<div className="p-6 space-y-6">
					{/* Image Gallery */}
					{hasImages && (
						<div className="relative">
							<div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
								<img
									src={currentImage.url}
									alt={currentImage.caption || p.title}
									className="w-full h-full object-cover"
								/>
								{/* Navigation Arrows */}
								{p.images.length > 1 && (
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
									{currentImageIndex + 1} / {p.images.length}
								</div>
							</div>

							{/* Thumbnail Navigation */}
							{p.images.length > 1 && (
								<div className="flex gap-2 mt-3 overflow-x-auto">
									{p.images.map((image, index) => (
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
							)}
						</div>
					)}

					{/* Property Information */}
					<div className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Home className="h-5 w-5" /> {p.title}</div>
					<div className="text-gray-600 flex items-center gap-2"><MapPin className="h-4 w-4" /> {p.address.city}, {p.address.state}</div>

					{/* Description */}
					{p.description && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600 mb-2">Description</div>
							<div className="text-gray-900">{p.description}</div>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Type</div>
							<div className="font-semibold capitalize">{p.type}</div>
						</div>
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Rent</div>
							<div className="font-semibold flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {p.pricing.rent.toLocaleString()}</div>
						</div>
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600">Status</div>
							<div className="font-semibold capitalize">{p.availability.status}</div>
						</div>
					</div>
					{p.currentTenant && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="text-sm text-gray-600 flex items-center gap-2"><Users className="h-4 w-4" /> Current Tenant</div>
							<div className="font-semibold">{p.currentTenant.name} • {p.currentTenant.email}</div>
						</div>
					)}
					<div className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="h-4 w-4" /> Added on {p.createdAt}</div>
				</div>
			</div>
		</div>
	);
};

export default PropertyDetailsModal;


