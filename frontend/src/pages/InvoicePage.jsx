import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { orderService } from '../services/api';
import InvoicePDF from '../components/invoice/InvoicePDF';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import { printInvoiceDocument } from '../utils/printInvoice';

const InvoicePage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`s2c_order_${orderId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    // Check if phone was provided in query params or if order is in session
    const phone = searchParams.get('phone') || order?.customerDetails?.phone || order?.customerPhone || '';

    if (!order && orderId) {
      setLoading(true);
      orderService
        .trackOrder(orderId.toUpperCase(), phone)
        .then((res) => {
          if (res.data?.success && res.data.order) {
            setOrder(res.data.order);
            setError('');
          } else {
            setError('Order details not found. Please verify Order ID.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load official invoice.');
        })
        .finally(() => setLoading(false));
    }
  }, [orderId, searchParams]);

  const handlePrint = () => {
    if (order) {
      printInvoiceDocument(order);
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-slate-900">
        <LoadingSpinner text="Generating dedicated tax invoice..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900 space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900">Invoice Not Available</h2>
          <p className="text-xs text-slate-600 mt-1">{error || 'Order could not be found.'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
          >
            Go Back
          </button>
          <Link
            to="/track-order"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950"
          >
            Track Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <SEO
        title={`Tax Invoice #${order.orderId} | S2C Crackers Sivakasi`}
        description={`Official Tax Invoice for Order #${order.orderId} from S2C Crackers Sivakasi.`}
        noindex={true}
      />

      {/* Standalone Document Header / Nav Bar (no-print) */}
      <div className="no-print max-w-4xl mx-auto flex items-center justify-between gap-4 pb-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Pure A4 Invoice Document */}
      <InvoicePDF order={order} onPrint={handlePrint} isStandalone={false} />
    </div>
  );
};

export default InvoicePage;
