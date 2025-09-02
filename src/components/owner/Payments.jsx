import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, XCircle, AlertTriangle, Clock, DollarSign, Users, Building } from 'lucide-react';

const StatusPill = ({ status }) => {
	const map = {
		paid: { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
		pending: { cls: 'bg-yellow-100 text-yellow-700', Icon: Clock },
		overdue: { cls: 'bg-red-100 text-red-700', Icon: AlertTriangle },
	};
	const item = map[status] || map.pending;
	const Icon = item.Icon;
	return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${item.cls}`}><Icon className="h-3.5 w-3.5" /> {status}</span>;
};

const OwnerPayments = () => {
	const [payments, setPayments] = useState([]);
	const [tenantPayments, setTenantPayments] = useState([]);
	const [summary, setSummary] = useState({});
	const [loading, setLoading] = useState(true);
	const [selectedTenant, setSelectedTenant] = useState(null);
	const [showTenantDetails, setShowTenantDetails] = useState(false);

	useEffect(() => {
		fetchPayments();
	}, []);

	const fetchPayments = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await fetch('http://localhost:5000/api/payments/owner', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				setPayments(data.allPayments);
				setTenantPayments(data.tenantPayments);
				setSummary(data.summary);
			} else {
				console.error('Failed to fetch payments:', response.status);
			}
		} catch (error) {
			console.error('Error fetching payments:', error);
		} finally {
			setLoading(false);
		}
	};

	const markAsPaid = async (paymentId, paymentMethod) => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await fetch(`http://localhost:5000/api/payments/${paymentId}/mark-paid`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentMethod,
					notes: `Marked as paid via ${paymentMethod}`
				})
			});

			if (response.ok) {
				await fetchPayments(); // Refresh the data
				alert('Payment marked as paid successfully!');
			} else {
				const errorData = await response.json();
				alert(`Failed to mark payment as paid: ${errorData.message}`);
			}
		} catch (error) {
			console.error('Error marking payment as paid:', error);
			alert('Failed to mark payment as paid. Please try again.');
		}
	};

	const openTenantDetails = (tenantData) => {
		setSelectedTenant(tenantData);
		setShowTenantDetails(true);
	};

	const generatePaymentsForExistingTenants = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			// First, get all tenants to check which ones need payment generation
			const tenantsResponse = await fetch('http://localhost:5000/api/tenants', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (!tenantsResponse.ok) {
				throw new Error('Failed to fetch tenants');
			}

			const tenantsData = await tenantsResponse.json();
			const tenants = tenantsData.tenants || [];

			let generatedCount = 0;
			let errors = [];

			// Generate payments for each tenant that has a property assigned
			for (const tenant of tenants) {
				if (tenant.assignedProperty && tenant.leaseStartDate && tenant.leaseEndDate && tenant.rentAmount) {
					try {
						const response = await fetch('http://localhost:5000/api/payments/generate-lease-payments', {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${token}`,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								tenantId: tenant._id,
								propertyId: tenant.assignedProperty,
								leaseStartDate: tenant.leaseStartDate,
								leaseEndDate: tenant.leaseEndDate,
								monthlyRent: tenant.rentAmount
							})
						});

						if (response.ok) {
							generatedCount++;
						} else {
							const errorData = await response.json();
							errors.push(`${tenant.name}: ${errorData.message}`);
						}
					} catch (error) {
						errors.push(`${tenant.name}: ${error.message}`);
					}
				}
			}

			// Show results
			if (generatedCount > 0) {
				alert(`Successfully generated payments for ${generatedCount} tenant(s)!`);
				await fetchPayments(); // Refresh the data
			}

			if (errors.length > 0) {
				alert(`Some errors occurred:\n${errors.join('\n')}`);
			}

			if (generatedCount === 0 && errors.length === 0) {
				alert('No tenants found that need payment generation, or payments already exist.');
			}

		} catch (error) {
			console.error('Error generating payments:', error);
			alert(`Failed to generate payments: ${error.message}`);
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">Payments</h2>
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
					<p className="text-gray-500 mt-2">Loading payments...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">Payment Dashboard</h2>
				<button
					onClick={fetchPayments}
					className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
				>
					<Download className="h-4 w-4" />
					Refresh
				</button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Tenants</p>
							<p className="text-2xl font-bold text-gray-900">{tenantPayments.length}</p>
						</div>
						<Users className="h-8 w-8 text-blue-500" />
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Collected</p>
							<p className="text-2xl font-bold text-green-600">₹{summary.totalCollected?.toLocaleString() || 0}</p>
						</div>
						<DollarSign className="h-8 w-8 text-green-500" />
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Pending Amount</p>
							<p className="text-2xl font-bold text-yellow-600">₹{summary.totalPending?.toLocaleString() || 0}</p>
						</div>
						<Clock className="h-8 w-8 text-yellow-500" />
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Late Fees</p>
							<p className="text-2xl font-bold text-red-600">₹{summary.totalLateFees?.toLocaleString() || 0}</p>
						</div>
						<AlertTriangle className="h-8 w-8 text-red-500" />
					</div>
				</div>
			</div>

			{/* Tenant Payment Overview */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Tenant Payment Overview</h3>
							<p className="text-sm text-gray-600">Click on a tenant to view detailed payment history</p>
						</div>
						<button
							onClick={generatePaymentsForExistingTenants}
							className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
						>
							<DollarSign className="h-4 w-4" />
							Generate Payments
						</button>
					</div>
				</div>
				<div className="p-6">
					{tenantPayments.length > 0 ? (
						<div className="space-y-4">
							{tenantPayments.map((tenantData, index) => (
								<div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openTenantDetails(tenantData)}>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<Building className="h-5 w-5 text-gray-400" />
												<div>
													<h4 className="font-semibold text-gray-900">{tenantData.tenant.name}</h4>
													<p className="text-sm text-gray-600">{tenantData.property.title}</p>
												</div>
											</div>
											<div className="grid grid-cols-3 gap-4 text-sm">
												<div>
													<span className="text-gray-500">Total Rent:</span>
													<p className="font-medium">₹{tenantData.totalRent.toLocaleString()}</p>
												</div>
												<div>
													<span className="text-gray-500">Paid:</span>
													<p className="font-medium text-green-600">₹{tenantData.totalPaid.toLocaleString()}</p>
												</div>
												<div>
													<span className="text-gray-500">Pending:</span>
													<p className="font-medium text-yellow-600">₹{tenantData.totalPending.toLocaleString()}</p>
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="mb-2">
												{tenantData.totalOverdue > 0 ? (
													<span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
														<AlertTriangle className="h-3 w-3" /> Overdue
													</span>
												) : (
													<span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
														<CheckCircle2 className="h-3 w-3" /> Up to date
													</span>
												)}
											</div>
											{tenantData.lateFees > 0 && (
												<p className="text-xs text-red-600">Late fees: ₹{tenantData.lateFees.toLocaleString()}</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<Building className="h-12 w-12 mx-auto text-gray-300 mb-3" />
							<p className="text-sm">No tenant payments found.</p>
							<p className="text-xs">Payments will appear here when tenants are assigned to properties.</p>
						</div>
					)}
				</div>
			</div>

			{/* All Payments Table */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b">
					<h3 className="text-lg font-semibold text-gray-900">All Payment Records</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{payments.map((payment) => (
								<tr key={payment._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div>
											<div className="text-sm font-medium text-gray-900">{payment.tenant?.name}</div>
											<div className="text-sm text-gray-500">{payment.tenant?.email}</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">{payment.property?.title}</div>
										<div className="text-sm text-gray-500">{payment.property?.address?.city}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{new Date(payment.leaseMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</div>
										{payment.lateFees > 0 && (
											<div className="text-xs text-red-600">+₹{payment.lateFees.toLocaleString()} late fees</div>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<StatusPill status={payment.status} />
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{new Date(payment.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										{payment.status !== 'paid' && (
											<div className="flex gap-2">
												<button
													onClick={() => markAsPaid(payment._id, 'cash')}
													className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md"
												>
													<CheckCircle2 className="h-4 w-4" /> Cash
												</button>
												<button
													onClick={() => markAsPaid(payment._id, 'bank_transfer')}
													className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
												>
													<CheckCircle2 className="h-4 w-4" /> Bank
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{payments.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
							<p className="text-sm">No payment records found.</p>
						</div>
					)}
				</div>
			</div>

			{/* Tenant Details Modal */}
			{showTenantDetails && selectedTenant && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between p-6 border-b">
							<h3 className="text-xl font-bold text-gray-900">Payment Details - {selectedTenant.tenant.name}</h3>
							<button
								onClick={() => setShowTenantDetails(false)}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								✕
							</button>
						</div>

						<div className="p-6 space-y-6">
							{/* Tenant Information */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h4 className="font-medium text-gray-700 mb-3">Tenant Information</h4>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-gray-500">Name:</span>
										<p className="font-medium">{selectedTenant.tenant.name}</p>
									</div>
									<div>
										<span className="text-gray-500">Email:</span>
										<p className="font-medium">{selectedTenant.tenant.email}</p>
									</div>
									<div>
										<span className="text-gray-500">Phone:</span>
										<p className="font-medium">{selectedTenant.tenant.phone}</p>
									</div>
									<div>
										<span className="text-gray-500">Property:</span>
										<p className="font-medium">{selectedTenant.tenant.property.title}</p>
									</div>
								</div>
							</div>

							{/* Payment Summary */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h4 className="font-medium text-gray-700 mb-3">Payment Summary</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<span className="text-gray-500">Total Rent:</span>
										<p className="font-medium text-lg">₹{selectedTenant.totalRent.toLocaleString()}</p>
									</div>
									<div>
										<span className="text-gray-500">Total Paid:</span>
										<p className="font-medium text-lg text-green-600">₹{selectedTenant.totalPaid.toLocaleString()}</p>
									</div>
									<div>
										<span className="text-gray-500">Total Pending:</span>
										<p className="font-medium text-lg text-yellow-600">₹{selectedTenant.totalPending.toLocaleString()}</p>
									</div>
									<div>
										<span className="text-gray-500">Late Fees:</span>
										<p className="font-medium text-lg text-red-600">₹{selectedTenant.lateFees.toLocaleString()}</p>
									</div>
								</div>
							</div>

							{/* Individual Payments */}
							<div>
								<h4 className="font-medium text-gray-700 mb-3">Monthly Payment History</h4>
								<div className="space-y-3">
									{selectedTenant.payments.map((payment) => (
										<div key={payment._id} className="border rounded-lg p-4">
											<div className="flex items-center justify-between">
												<div>
													<div className="font-medium text-gray-900">
														{new Date(payment.leaseMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
													</div>
													<div className="text-sm text-gray-500">
														Due: {new Date(payment.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
													</div>
												</div>
												<div className="text-right">
													<div className="font-medium text-gray-900">₹{payment.amount.toLocaleString()}</div>
													<StatusPill status={payment.status} />
													{payment.lateFees > 0 && (
														<div className="text-xs text-red-600">+₹{payment.lateFees.toLocaleString()} late fees</div>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default OwnerPayments;


