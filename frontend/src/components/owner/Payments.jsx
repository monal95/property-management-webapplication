import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building
} from 'lucide-react';
import api from '../../api';

const StatusPill = ({ status }) => {
  const map = {
    paid: { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
    pending: { cls: 'bg-yellow-100 text-yellow-700', Icon: Clock },
    overdue: { cls: 'bg-red-100 text-red-700', Icon: AlertTriangle }
  };
  const item = map[status] || map.pending;
  const Icon = item.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${item.cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
};

const TenantPayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({
    razorpayAvailable: false
  });

  useEffect(() => {
    fetchPayments();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get(
        '/payments/payment-status',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get(
        '/payments/tenant',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.status === 200) {
        const data = response.data;
        if (data.success) {
          setPayments(data.payments);
          setSummary(data.summary);
        } else {
          console.error('Failed to fetch payments:', data.message);
        }
      } else {
        console.error('Failed to fetch payments:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelection = (paymentId, checked) => {
    if (checked) {
      setSelectedPayments((prev) => [...prev, paymentId]);
    } else {
      setSelectedPayments((prev) =>
        prev.filter((id) => id !== paymentId)
      );
    }
  };

  const calculateTotalAmount = () => {
    return payments
      .filter((p) => selectedPayments.includes(p._id))
      .reduce((sum, p) => {
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

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const initializeRazorpay = async (orderData) => {
    try {
      await loadRazorpayScript();

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'Property Management System',
        description: `Rent Payment - ${orderData.payments.length} month(s)`,
        order_id: orderData.orderId,
        handler: async function (response) {
          setPaying(true);
          await verifyPayment(
            orderData.orderId,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: 'Tenant',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        theme: { color: '#000000' },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setShowPaymentModal(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(
          `Payment failed: ${
            response.error.description || 'Unknown error'
          }`
        );
        setPaying(false);
        setShowPaymentModal(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Razorpay init error:', error);
      alert('Payment gateway error. Please try again.');
      setPaying(false);
      setShowPaymentModal(false);
    }
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
        alert('Authentication required. Please login again.');
        setPaying(false);
        return;
      }

      const response = await api.post(
        '/payments/create-order',
        { paymentIds: selectedPayments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (response.status !== 200) {
        alert(`Payment Error: ${data.message || 'Unknown error'}`);
        setPaying(false);
        setShowPaymentModal(false);
        return;
      }

      if (!data.success || !data.orderId || !data.razorpayKeyId) {
        alert('Invalid response from server.');
        setPaying(false);
        setShowPaymentModal(false);
        return;
      }

      await initializeRazorpay(data);
    } catch (error) {
      console.error('Error starting payment:', error);
      alert('Failed to start payment. Please try again.');
      setPaying(false);
      setShowPaymentModal(false);
    }
  };

  const verifyPayment = async (orderId, paymentId, signature) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication error. Please login again.');
        return;
      }

      const response = await api.post(
        '/payments/verify-payment',
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (response.status === 200 && data.success) {
        alert('🎉 Payment successful!');
        setSelectedPayments([]);
        setShowPaymentModal(false);
        await fetchPayments();
      } else {
        alert(
          `Payment verification failed: ${
            data.message || 'Please contact support'
          }`
        );
      }
    } catch (error) {
      console.error('Verify error:', error);
      alert('Payment verification failed. Please contact support.');
    } finally {
      setPaying(false);
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

      {/* Payment Status */}
      {!paymentStatus.razorpayAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Payment System Notice
              </h3>
              <p className="text-sm text-yellow-700">
                Online payment is currently being configured. Please
                contact your landlord for alternatives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Rent
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary.totalAmount?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.totalPaid?.toLocaleString() || 0}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{summary.totalPending?.toLocaleString() || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Late Fees
              </p>
              <p className="text-2xl font-bold text-red-600">
                ₹{summary.totalLateFees?.toLocaleString() || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Overdue */}
      {summary.overdueAmount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800">
                Payment Overdue
              </h3>
              <p className="text-sm text-red-700">
                You have {summary.overdueMonths} month(s) overdue,
                totaling ₹{summary.overdueAmount.toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Make Payment
            </h3>
            <p className="text-sm text-gray-600">
              Select months you want to pay and click Pay Selected
            </p>
          </div>
          <button
            onClick={openPaymentModal}
            disabled={selectedPayments.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            Pay Selected ({selectedPayments.length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedPayments.length ===
                      payments.filter((p) => p.status !== 'paid').length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(
                          payments
                            .filter((p) => p.status !== 'paid')
                            .map((p) => p._id)
                        );
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left">Month</th>
                <th className="px-6 py-3 text-left">Property</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Due Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment._id)}
                      onChange={(e) =>
                        handlePaymentSelection(
                          payment._id,
                          e.target.checked
                        )
                      }
                      disabled={payment.status === 'paid'}
                    />
                  </td>
                  <td>
                    {new Date(payment.leaseMonth).toLocaleDateString(
                      'en-US',
                      { year: 'numeric', month: 'long' }
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <div>{payment.property?.title}</div>
                        <div className="text-sm text-gray-500">
                          {payment.property?.address?.city}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    ₹{payment.amount.toLocaleString()}
                    {payment.lateFees > 0 && (
                      <div className="text-xs text-red-600">
                        +₹{payment.lateFees.toLocaleString()} late fees
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusPill status={payment.status} />
                  </td>
                  <td>
                    {new Date(payment.dueDate).toLocaleDateString(
                      'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    )}
                    {payment.status !== 'paid' &&
                      getDaysOverdue(payment.dueDate) > 0 && (
                        <div className="text-xs text-red-600">
                          {getDaysOverdue(payment.dueDate)} days overdue
                        </div>
                      )}
                  </td>
                  <td>
                    {payment.status === 'paid' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Paid on{' '}
                        {new Date(
                          payment.paymentDate
                        ).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Select above to pay
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
              <p>No payment records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Payment
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Total Amount to Pay:
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{payAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPayments.length} month(s) selected
                </p>
              </div>

              <div className="space-y-2">
                {payments
                  .filter((p) => selectedPayments.includes(p._id))
                  .map((payment) => (
                    <div
                      key={payment._id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {new Date(
                          payment.leaseMonth
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </span>
                      <span>₹{payment.amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={startPayment}
                  disabled={paying}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Pay Selected'}
                </button>
              </div>
              {!paymentStatus.razorpayAvailable && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 text-center">
                    ℹ️ Online payment gateway is being configured.
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
