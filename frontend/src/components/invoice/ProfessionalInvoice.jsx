import React from 'react';
import InvoicePDF from './InvoicePDF';

/**
 * Re-export dedicated InvoicePDF for backward compatibility
 */
const ProfessionalInvoice = (props) => {
  return <InvoicePDF {...props} />;
};

export default ProfessionalInvoice;
