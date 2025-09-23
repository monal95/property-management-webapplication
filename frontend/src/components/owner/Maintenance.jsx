import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Wrench, Clock, MessageSquare, Search, Plus, Eye } from 'lucide-react';
import api from '../../api';

const PriorityPill = ({ value }) => {
	const styles = value === 'high' ? 'bg-red-100 text-red-700' : value === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
	return <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${styles}`}>{value}</span>;
};

const StatusPill = ({ value }) => {
	const map = {
		open: { cls: 'bg-orange-100 text-orange-700', Icon: AlertTriangle },
		in_progress: { cls: 'bg-blue-100 text-blue-700', Icon: Wrench },
		resolved: { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
	};
	const item = map[value] || map.open;
	const Icon = item.Icon;
	return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${item.cls}`}><Icon className="h-3.5 w-3.5" /> {value.replace('_', ' ')}</span>;
};

const OwnerMaintenance = () => {
	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState('all');
	const [maintenanceRequests, setMaintenanceRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [updatingStatus, setUpdatingStatus] = useState(false);
	const [statusNote, setStatusNote] = useState('');

	useEffect(() => {
		fetchMaintenanceRequests();
	}, []);

	const fetchMaintenanceRequests = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.get('/maintenance/owner', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 200) {
				const data = response.data;
				setMaintenanceRequests(data);
			} else {
				console.error('Failed to fetch maintenance requests:', response.status);
			}
		} catch (error) {
			console.error('Error fetching maintenance requests:', error?.response?.data || error);
		} finally {
			setLoading(false);
		}
	};

	const updateStatus = async (requestId, newStatus) => {
		if (!statusNote.trim()) {
			alert('Please add a note when updating status');
			return;
		}

		setUpdatingStatus(true);
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.patch(`/maintenance/${requestId}/status`, {
				status: newStatus,
				notes: statusNote
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 200) {
				await fetchMaintenanceRequests(); // Refresh the list
				setStatusNote('');
				alert('Status updated successfully!');
			} else {
				const errorData = response.data;
				alert(`Failed to update status: ${errorData.message}`);
			}
		} catch (error) {
			console.error('Error updating status:', error?.response?.data || error);
			alert('Failed to update status. Please try again.');
		} finally {
			setUpdatingStatus(false);
		}
	};

	const openDetailsModal = async (requestId) => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.get(`/maintenance/${requestId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 200) {
				const data = response.data;
				setSelectedRequest(data);
				setShowDetailsModal(true);
			}
		} catch (error) {
			console.error('Error fetching maintenance request details:', error?.response?.data || error);
		}
	};

	const filtered = useMemo(() => {
		const q = query.toLowerCase();
		return maintenanceRequests.filter(c => {
			const f1 = filter === 'all' || c.status === filter;
			const f2 = !q || c.title.toLowerCase().includes(q) ||
				(c.tenant?.name && c.tenant.name.toLowerCase().includes(q)) ||
				(c.property?.title && c.property.title.toLowerCase().includes(q));
			return f1 && f2;
		});
	}, [query, filter, maintenanceRequests]);

	const getCategoryIcon = (category) => {
		switch (category) {
			case 'plumbing': return '🚰';
			case 'electrical': return '⚡';
			case 'hvac': return '❄️';
			case 'structural': return '🏗️';
			case 'appliance': return '🔌';
			default: return '🔧';
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
					<p className="text-gray-500 mt-2">Loading maintenance requests...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h2>
				<div className="text-sm text-gray-600 flex items-center gap-2">
					<Clock className="h-4 w-4" />
					{filtered.filter(r => r.status !== 'resolved').length} open items
				</div>
			</div>

			<div className="bg-white rounded-lg shadow p-4 flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder="Search title, tenant, property..."
						className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
					/>
				</div>
				<select
					value={filter}
					onChange={e => setFilter(e.target.value)}
					className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
				>
					<option value="all">All</option>
					<option value="open">Open</option>
					<option value="in_progress">In Progress</option>
					<option value="resolved">Resolved</option>
				</select>
			</div>

			<div className="space-y-3">
				{filtered.map(request => (
					<div key={request._id} className="bg-white rounded-lg shadow p-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="font-semibold text-gray-900 flex items-center gap-2">
									{getCategoryIcon(request.category)} {request.title}
									<PriorityPill value={request.priority} />
									<StatusPill value={request.status} />
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Tenant: {request.tenant?.name || 'Unknown'} •
									Property: {request.property?.title || 'Unknown'} •
									{new Date(request.createdAt).toLocaleDateString()}
								</div>
								<div className="text-sm text-gray-700 mt-2">{request.description}</div>

								{/* Quick status update */}
								{request.status !== 'resolved' && (
									<div className="mt-3 p-3 bg-gray-50 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<input
												type="text"
												value={statusNote}
												onChange={(e) => setStatusNote(e.target.value)}
												placeholder="Add a note about this update..."
												className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black"
											/>
											<button
												onClick={() => updateStatus(request._id, 'in_progress')}
												disabled={updatingStatus || !statusNote.trim()}
												className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{updatingStatus ? 'Updating...' : 'Mark In Progress'}
											</button>
											<button
												onClick={() => updateStatus(request._id, 'resolved')}
												disabled={updatingStatus || !statusNote.trim()}
												className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{updatingStatus ? 'Updating...' : 'Mark Resolved'}
											</button>
										</div>
									</div>
								)}
							</div>
							<div className="flex gap-2 ml-4">
								<button
									onClick={() => openDetailsModal(request._id)}
									className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
								>
									<Eye className="h-4 w-4" /> View Details
								</button>
							</div>
						</div>
					</div>
				))}
				{filtered.length === 0 && (
					<div className="text-center py-8 text-gray-500">
						<Wrench className="h-12 w-12 mx-auto text-gray-300 mb-3" />
						<p className="text-sm">No maintenance requests found.</p>
						<p className="text-xs">New tenant complaints will appear here automatically.</p>
					</div>
				)}
			</div>

			{/* Details Modal */}
			{showDetailsModal && selectedRequest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between p-6 border-b">
							<h3 className="text-xl font-bold text-gray-900">Maintenance Request Details</h3>
							<button
								onClick={() => setShowDetailsModal(false)}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								✕
							</button>
						</div>

						<div className="p-6 space-y-4">
							<div>
								<h4 className="font-semibold text-gray-900">{selectedRequest.title}</h4>
								<p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
							</div>

							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="font-medium text-gray-700">Priority:</span>
									<PriorityPill value={selectedRequest.priority} />
								</div>
								<div>
									<span className="font-medium text-gray-700">Status:</span>
									<StatusPill value={selectedRequest.status} />
								</div>
								<div>
									<span className="font-medium text-gray-700">Category:</span>
									<span className="ml-2">{getCategoryIcon(selectedRequest.category)} {selectedRequest.category}</span>
								</div>
								<div>
									<span className="font-medium text-gray-700">Submitted:</span>
									<span className="ml-2">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
								</div>
							</div>

							<div>
								<h5 className="font-medium text-gray-700 mb-2">Tenant Information</h5>
								<div className="bg-gray-50 p-3 rounded-lg">
									<p><span className="font-medium">Name:</span> {selectedRequest.tenant?.name}</p>
									<p><span className="font-medium">Email:</span> {selectedRequest.tenant?.email}</p>
									<p><span className="font-medium">Phone:</span> {selectedRequest.tenant?.phone}</p>
								</div>
							</div>

							<div>
								<h5 className="font-medium text-gray-700 mb-2">Property Information</h5>
								<div className="bg-gray-50 p-3 rounded-lg">
									<p><span className="font-medium">Title:</span> {selectedRequest.property?.title}</p>
									<p><span className="font-medium">Address:</span> {selectedRequest.property?.address?.street}, {selectedRequest.property?.address?.city}</p>
								</div>
							</div>

							{selectedRequest.notes && selectedRequest.notes.length > 0 && (
								<div>
									<h5 className="font-medium text-gray-700 mb-2">Communication History</h5>
									<div className="space-y-2">
										{selectedRequest.notes.map((note, index) => (
											<div key={index} className="bg-gray-50 p-3 rounded-lg">
												<div className="flex items-center justify-between mb-1">
													<span className={`font-medium text-sm ${note.author === 'tenant' ? 'text-blue-600' :
															note.author === 'owner' ? 'text-green-600' : 'text-gray-600'
														}`}>
														{note.author === 'tenant' ? 'Tenant' :
															note.author === 'owner' ? 'Owner' : 'Maintenance'}
													</span>
													<span className="text-xs text-gray-400">
														{new Date(note.timestamp).toLocaleDateString()}
													</span>
												</div>
												<p className="text-sm text-gray-700">{note.message}</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default OwnerMaintenance;


