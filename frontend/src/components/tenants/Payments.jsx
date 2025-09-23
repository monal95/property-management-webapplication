import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle2, Clock, DollarSign, Building } from 'lucide-react';
import api from '../../api';

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

const TenantPayments = () => {
	const [payments, setPayments] = useState([]);
	const [summary, setSummary] = useState({});
	const [loading, setLoading] = useState(true);
	const [selectedPayments, setSelectedPayments] = useState([]);
	const [payAmount, setPayAmount] = useState(0);
	const [paying, setPaying] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);

	useEffect(() => {
		fetchPayments();
	}, []);

	const fetchPayments = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.get('/payments/tenant', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = response.data;
			setPayments(data.payments);
			setSummary(data.summary);
		} catch (error) {
			console.error('Error fetching payments:', error?.response?.data || error);
		} finally {
			setLoading(false);
		}
	};

	const handlePaymentSelection = (paymentId, checked) => {
		if (checked) {
			setSelectedPayments(prev => [...prev, paymentId]);
		} else {
			setSelectedPayments(prev => prev.filter(id => id !== paymentId));
		}
	};

	const calculateTotalAmount = () => {
		return payments
			.filter(p => selectedPayments.includes(p._id))
			.reduce((sum, p) => {
				// Use the totalAmount field from the backend (includes late fees)
				return sum + (p.totalAmount || p.amount);
			}, 0);
	};

	const openPaymentModal = () => {
		if (selectedPayments.length === 0) {
			alert('Please select at least one payment to make');
			return;
		}
		setPayAmount(calculateTotalAmount());
		setShowPaymentModal(true);
	};

	const startPayment = async () => {
		if (selectedPayments.length === 0) {
			alert('Please select payments to pay');
			return;
		}

		setPaying(true);
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				alert('Authentication required');
				return;
			}

			// Create Razorpay order
			const response = await api.post('/payments/create-order', {
				paymentIds: selectedPayments
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 200) {
				const data = response.data;

				// Check if Razorpay is available
				if (typeof window.Razorpay === 'undefined') {
					alert('Online payment is not available at the moment. Please contact your landlord for alternative payment methods.');
					return;
				}

				// Initialize Razorpay payment
				const options = {
					key: 'rzp_test_YOUR_KEY_ID', // This will be replaced with actual key when Razorpay is configured
					amount: data.amount * 100, // Razorpay expects amount in paise
					currency: data.currency,
					name: 'Rentify',
					description: `Rent Payment - ${data.payments.length} month(s)`,
					order_id: data.orderId,
					handler: async function (response) {
						// Verify payment on backend
						await verifyPayment(data.orderId, response.razorpay_payment_id, response.razorpay_signature);
					},
					prefill: {
						name: 'Tenant Name',
						email: 'tenant@example.com',
						contact: '+919876543210'
					},
					theme: {
						color: '#000000'
					}
				};

				try {
					const rzp = new window.Razorpay(options);
					rzp.open();
				} catch (error) {
					console.error('Razorpay initialization error:', error);
					alert('Payment gateway error. Please try again or contact support.');
				}
			} else {
				const errorData = response.data;
				if (response.status === 503) {
					alert('Online payment is currently unavailable. Please contact your landlord for alternative payment methods.');
				} else {
					alert(`Failed to create payment order: ${errorData.message}`);
				}
			}
		} catch (error) {
			console.error('Error starting payment:', error?.response?.data || error);
			alert('Failed to start payment. Please try again.');
		} finally {
			setPaying(false);
			setShowPaymentModal(false);
		}
	};

	const verifyPayment = async (orderId, paymentId, signature) => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const response = await api.post('/payments/verify-payment', {
				razorpay_order_id: orderId,
				razorpay_payment_id: paymentId,
				razorpay_signature: signature
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 200) {
				alert('Payment successful! Your rent has been paid.');
				setSelectedPayments([]);
				await fetchPayments(); // Refresh the data
			} else {
				const errorData = response.data;
				alert(`Payment verification failed: ${errorData.message}`);
			}
		} catch (error) {
			console.error('Error verifying payment:', error?.response?.data || error);
			alert('Payment verification failed. Please contact support.');
		}
	};

	const getDaysOverdue = (dueDate) => {
		const today = new Date();
		const due = new Date(dueDate);
		const diffTime = today - due;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 0;
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">My Payments</h2>
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
					<p className="text-gray-500 mt-2">Loading payments...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">My Payments</h2>

			{/* Payment Summary */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Rent</p>
							<p className="text-2xl font-bold text-gray-900">₹{summary.totalAmount?.toLocaleString() || 0}</p>
						</div>
						<DollarSign className="h-8 w-8 text-blue-500" />
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Paid</p>
							<p className="text-2xl font-bold text-green-600">₹{summary.totalPaid?.toLocaleString() || 0}</p>
						</div>
						<CheckCircle2 className="h-8 w-8 text-green-500" />
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Pending</p>
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

			{/* Overdue Warning */}
			{summary.overdueAmount > 0 && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-6 w-6 text-red-500" />
						<div>
							<h3 className="font-medium text-red-800">Payment Overdue</h3>
							<p className="text-sm text-red-700">
								You have {summary.overdueMonths} month(s) of overdue payments totaling ₹{summary.overdueAmount.toLocaleString()}.
								Please make payment as soon as possible to avoid additional late fees.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Payment Actions */}
			<div className="bg-white rounded-lg shadow p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
						<p className="text-sm text-gray-600">
							Select the months you want to pay for and click "Pay Selected"
						</p>
						{typeof window.Razorpay === 'undefined' && (
							<p className="text-xs text-yellow-600 mt-1">
								⚠️ Online payment setup in progress. Contact your landlord for payment options.
							</p>
						)}
					</div>
					<button
						onClick={openPaymentModal}
						disabled={selectedPayments.length === 0}
						className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<CreditCard className="h-4 w-4" />
						Pay Selected ({selectedPayments.length})
					</button>
				</div>
			</div>

			{/* Payments List */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b">
					<h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									<input
										type="checkbox"
										checked={selectedPayments.length === payments.filter(p => p.status !== 'paid').length}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedPayments(payments.filter(p => p.status !== 'paid').map(p => p._id));
											} else {
												setSelectedPayments([]);
											}
										}}
										className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
									/>
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
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
										<input
											type="checkbox"
											checked={selectedPayments.includes(payment._id)}
											onChange={(e) => handlePaymentSelection(payment._id, e.target.checked)}
											disabled={payment.status === 'paid'}
											className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded disabled:opacity-50"
										/>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{new Date(payment.leaseMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center gap-2">
											<Building className="h-4 w-4 text-gray-400" />
											<div>
												<div className="text-sm font-medium text-gray-900">{payment.property?.title}</div>
												<div className="text-sm text-gray-500">{payment.property?.address?.city}</div>
											</div>
										</div>
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
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">
											{new Date(payment.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
										</div>
										{payment.status !== 'paid' && getDaysOverdue(payment.dueDate) > 0 && (
											<div className="text-xs text-red-600">{getDaysOverdue(payment.dueDate)} days overdue</div>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										{payment.status === 'paid' ? (
											<div className="flex items-center gap-2 text-green-600">
												<CheckCircle2 className="h-4 w-4" />
												Paid on {new Date(payment.paymentDate).toLocaleDateString()}
											</div>
										) : (
											<div className="text-gray-500">Select above to pay</div>
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
							<p className="text-xs">Contact your landlord to set up payment schedules.</p>
						</div>
					)}
				</div>
			</div>

			{/* Payment Modal */}
			{showPaymentModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
						<div className="p-6 border-b">
							<h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
						</div>
						<div className="p-6 space-y-4">
							<div className="text-center">
								<p className="text-sm text-gray-600 mb-2">Total Amount to Pay:</p>
								<p className="text-3xl font-bold text-gray-900">₹{payAmount.toLocaleString()}</p>
								<p className="text-xs text-gray-500 mt-1">
									{selectedPayments.length} month(s) selected
								</p>
							</div>

							<div className="space-y-2">
								{payments
									.filter(p => selectedPayments.includes(p._id))
									.map(payment => (
										<div key={payment._id} className="flex justify-between text-sm">
											<span>{new Date(payment.leaseMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
											<span>₹{payment.amount.toLocaleString()}</span>
										</div>
									))}
							</div>

							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setShowPaymentModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={startPayment}
									disabled={paying}
									className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{paying ? 'Processing...' : 'Pay Selected'}
								</button>
							</div>
							{typeof window.Razorpay === 'undefined' && (
								<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="text-xs text-yellow-800 text-center">
										ℹ️ Online payment gateway is being configured. You'll be able to make payments once it's ready.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TenantPayments;


