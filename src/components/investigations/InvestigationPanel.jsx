import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';

const InvestigationPanel = ({ caseId, sessionId, onViewResult }) => {
  const [availableInvestigations, setAvailableInvestigations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch available investigations for case
  useEffect(() => {
    if (!caseId) return;

    const fetchInvestigations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cases/${caseId}/investigations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableInvestigations(data.investigations || []);
        }
      } catch (error) {
        console.error('Failed to fetch investigations:', error);
      }
    };

    fetchInvestigations();
  }, [caseId]);

  // Fetch orders for session
  const fetchOrders = async () => {
    if (!sessionId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sessions/${sessionId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Order selected tests
  const handleOrderTests = async () => {
    if (selectedTests.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sessions/${sessionId}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          investigation_ids: selectedTests
        })
      });

      if (response.ok) {
        setSelectedTests([]);
        await fetchOrders();
      }
    } catch (error) {
      console.error('Failed to order tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle test selection
  const toggleTest = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  // Calculate time remaining
  const getTimeRemaining = (availableAt) => {
    const now = new Date();
    const available = new Date(availableAt);
    const diff = available - now;

    if (diff <= 0) return 'Ready';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const pendingOrders = orders.filter(o => !o.is_ready);
  const readyOrders = orders.filter(o => o.is_ready && !o.viewed_at);

  if (!caseId || !sessionId) {
    return null;
  }

  return (
    <div className="relative">
      {/* Order Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
      >
        <ClipboardList className="w-5 h-5" />
        Order Tests
        {readyOrders.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {readyOrders.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Order Investigations</h3>
            <p className="text-sm text-gray-400">Select tests to order</p>
          </div>

          {/* Available Tests */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Available Tests</h4>
            {availableInvestigations.length === 0 ? (
              <p className="text-sm text-gray-500">No tests available for this case</p>
            ) : (
              <div className="space-y-2">
                {availableInvestigations.map(inv => {
                  const alreadyOrdered = orders.some(o => o.investigation_id === inv.id);
                  return (
                    <label
                      key={inv.id}
                      className={`flex items-start gap-3 p-3 rounded border ${
                        alreadyOrdered
                          ? 'bg-gray-700/30 border-gray-600 opacity-50'
                          : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(inv.id)}
                        onChange={() => !alreadyOrdered && toggleTest(inv.id)}
                        disabled={alreadyOrdered}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{inv.test_name}</div>
                        <div className="text-xs text-gray-400">
                          {inv.investigation_type} • {inv.turnaround_minutes} min
                        </div>
                        {alreadyOrdered && (
                          <div className="text-xs text-blue-400 mt-1">Already ordered</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Order Button */}
            {selectedTests.length > 0 && (
              <button
                onClick={handleOrderTests}
                disabled={loading}
                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                {loading ? 'Ordering...' : `Order ${selectedTests.length} Test${selectedTests.length > 1 ? 's' : ''}`}
              </button>
            )}

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Results
                </h4>
                <div className="space-y-2">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="p-3 rounded bg-yellow-900/20 border border-yellow-700/50">
                      <div className="text-sm text-white">{order.test_name}</div>
                      <div className="text-xs text-yellow-400 mt-1">
                        Available in: {getTimeRemaining(order.available_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready Results */}
            {readyOrders.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Results Ready
                </h4>
                <div className="space-y-2">
                  {readyOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => {
                        onViewResult(order);
                        setShowPanel(false);
                      }}
                      className="w-full p-3 rounded bg-green-900/20 border border-green-700/50 hover:bg-green-900/30 text-left"
                    >
                      <div className="text-sm text-white font-medium">{order.test_name}</div>
                      <div className="text-xs text-green-400 mt-1">Click to view results</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => setShowPanel(false)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationPanel;
