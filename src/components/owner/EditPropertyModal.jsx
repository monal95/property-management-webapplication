import React, { useEffect, useState } from 'react';
import { X, Home, DollarSign, Calendar } from 'lucide-react';

const EditPropertyModal = ({ property, onClose, onEdit }) => {
	const [formData, setFormData] = useState({
		title: '',
		type: 'apartment',
		pricing: { rent: '' },
		availability: { status: 'available', availableFrom: '' },
	});

	useEffect(() => {
		if (property) {
			setFormData({
				title: property.title || '',
				type: property.type || 'apartment',
				pricing: { rent: property.pricing?.rent ?? '' },
				availability: {
					status: property.availability?.status || 'available',
					availableFrom: property.availability?.availableFrom || '',
				},
			});
		}
	}, [property]);

	const handleInputChange = (field, value) => {
		if (field.includes('.')) {
			const [parent, child] = field.split('.');
			setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
		} else {
			setFormData(prev => ({ ...prev, [field]: value }));
		}
	};

	const submit = (e) => {
		e.preventDefault();
		onEdit(formData);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-2xl font-bold text-gray-900">Edit Property</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						<X className="h-6 w-6" />
					</button>
				</div>
				<form onSubmit={submit} className="p-6 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
							<input value={formData.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
							<select value={formData.type} onChange={e => handleInputChange('type', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
								<option value="apartment">Apartment</option>
								<option value="house">House</option>
								<option value="villa">Villa</option>
								<option value="commercial">Commercial</option>
							</select>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Monthly Rent (₹)</label>
							<input type="number" min="0" value={formData.pricing.rent} onChange={e => handleInputChange('pricing.rent', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> Available From</label>
							<input type="date" value={formData.availability.availableFrom} onChange={e => handleInputChange('availability.availableFrom', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Home className="h-4 w-4" /> Status</label>
						<select value={formData.availability.status} onChange={e => handleInputChange('availability.status', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
							<option value="available">Available</option>
							<option value="maintenance">Maintenance</option>
							<option value="reserved">Reserved</option>
							<option value="rented">Rented</option>
						</select>
					</div>
					<div className="flex justify-end gap-3 pt-4 border-t">
						<button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
						<button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">Save Changes</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditPropertyModal;


