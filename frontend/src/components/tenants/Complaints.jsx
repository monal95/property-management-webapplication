import React, { useState, useEffect } from 'react';
import { Send, Plus, AlertTriangle, Clock, CheckCircle2, Wrench } from 'lucide-react';
import api from '../../api';

const TenantComplaints = () => {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState('medium');
	const [category, setCategory] = useState('other');
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);

	useEffect(() => {
		fetchComplaints();
	}, []);

	const fetchComplaints = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.get('/maintenance/tenant', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = response.data;
			setItems(data);
		} catch (error) {
			console.error('Error fetching complaints:', error?.response?.data || error);
		} finally {
			setFetching(false);
		}
	};

	const submitComplaint = async (e) => {
		e.preventDefault();
		if (!title || !description) return alert('Please fill title and description');
		
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				alert('Authentication required');
				return;
			}

			const response = await api.post('/maintenance', {
				title,
				description,
				priority,
				category
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 201 || response.status === 200) {
				const data = response.data;
				setItems([data.maintenanceRequest, ...items]);
				setTitle('');
				setDescription('');
				setPriority('medium');
				setCategory('other');
				alert('Complaint submitted successfully!');
			} else {
				const errorData = response.data;
				alert(`Failed to submit complaint: ${errorData.message}`);
			}
		} catch (error) {
			console.error('Error submitting complaint:', error?.response?.data || error);
			alert('Failed to submit complaint. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'open':
				return <Clock className="h-4 w-4 text-orange-500" />;
			case 'in_progress':
				return <Wrench className="h-4 w-4 text-blue-500" />;
			case 'resolved':
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case 'high':
				return 'bg-red-100 text-red-700';
			case 'medium':
				return 'bg-yellow-100 text-yellow-700';
			case 'low':
				return 'bg-green-100 text-green-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	};

	const getCategoryIcon = (category) => {
		switch (category) {
			case 'plumbing':
				return '🚰';
			case 'electrical':
				return '⚡';
			case 'hvac':
				return '❄️';
			case 'structural':
				return '🏗️';
			case 'appliance':
				return '🔌';
			default:
				return '🔧';
		}
	};

	if (fetching) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">Complaints</h2>
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
					<p className="text-gray-500 mt-2">Loading complaints...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">Maintenance Complaints</h2>
			
			<form onSubmit={submitComplaint} className="bg-white rounded-lg shadow p-6 space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
						<input 
							value={title} 
							onChange={e => setTitle(e.target.value)} 
							className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black" 
							placeholder="e.g., Water leakage in kitchen" 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
						<select 
							value={category} 
							onChange={e => setCategory(e.target.value)}
							className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
						>
							<option value="plumbing">🚰 Plumbing</option>
							<option value="electrical">⚡ Electrical</option>
							<option value="hvac">❄️ HVAC</option>
							<option value="structural">🏗️ Structural</option>
							<option value="appliance">🔌 Appliance</option>
							<option value="other">🔧 Other</option>
						</select>
					</div>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
					<textarea 
						value={description} 
						onChange={e => setDescription(e.target.value)} 
						className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black" 
						rows={3} 
						placeholder="Describe the issue in detail..." 
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
					<select 
						value={priority} 
						onChange={e => setPriority(e.target.value)}
						className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
					>
						<option value="low">🟢 Low - Minor issue, can wait</option>
						<option value="medium">🟡 Medium - Moderate urgency</option>
						<option value="high">🔴 High - Urgent, needs immediate attention</option>
					</select>
				</div>

				<button 
					type="submit" 
					disabled={loading} 
					className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<Plus className="h-4 w-4" /> 
					{loading ? 'Submitting...' : 'Submit Complaint'}
				</button>
			</form>

			<div className="space-y-3">
				<h3 className="text-lg font-semibold text-gray-900">Your Complaints</h3>
				{items.map(item => (
					<div key={item._id} className="bg-white rounded-lg shadow p-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="font-semibold text-gray-900 flex items-center gap-2">
									{getCategoryIcon(item.category)} {item.title}
									<span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(item.priority)}`}>
										{item.priority}
									</span>
									<span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700">
										{getStatusIcon(item.status)} {item.status.replace('_', ' ')}
									</span>
								</div>
								<div className="text-sm text-gray-600 mt-2">{item.description}</div>
								<div className="text-xs text-gray-500 mt-2">
									Property: {item.property?.title || 'Unknown'} • 
									Submitted: {new Date(item.createdAt).toLocaleDateString()}
								</div>
								
								{/* Notes section */}
								{item.notes && item.notes.length > 0 && (
									<div className="mt-3 p-3 bg-gray-50 rounded-lg">
										<h4 className="text-sm font-medium text-gray-700 mb-2">Updates:</h4>
										<div className="space-y-2">
											{item.notes.map((note, index) => (
												<div key={index} className="text-sm">
													<span className={`font-medium ${
														note.author === 'tenant' ? 'text-blue-600' : 
														note.author === 'owner' ? 'text-green-600' : 'text-gray-600'
													}`}>
														{note.author === 'tenant' ? 'You' : 
														 note.author === 'owner' ? 'Owner' : 'Maintenance'}
													</span>
													<span className="text-gray-600">: {note.message}</span>
													<span className="text-xs text-gray-400 ml-2">
														{new Date(note.timestamp).toLocaleDateString()}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				))}
				{items.length === 0 && (
					<div className="text-center py-8 text-gray-500">
						<AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
						<p className="text-sm">No complaints submitted yet.</p>
						<p className="text-xs">Submit your first maintenance request above.</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TenantComplaints;


