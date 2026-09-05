import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createWhatsAppGeneralChatUrl } from '../../utils/whatsappHelper';

const WhatsAppFloatingButton = ({ whatsappNumber = '919944476516' }) => {
  const { totalItemsCount } = useCart();
  const hasCartItems = totalItemsCount > 0;

  const whatsappUrl = createWhatsAppGeneralChatUrl(
    whatsappNumber,
    'Hello S2C Crackers, I would like to place an order.'
  );

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with S2C Crackers on WhatsApp"
      className={`fixed left-4 sm:left-6 z-30 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-950/70 border border-emerald-400/40 group transition-all duration-300 ${
        hasCartItems ? 'bottom-24 sm:bottom-28' : 'bottom-6'
      }`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-emerald-600" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
      </div>
      <div className="hidden sm:flex flex-col text-left">
        <span className="text-[10px] text-emerald-100 font-semibold tracking-wide uppercase">Direct WhatsApp</span>
        <span className="text-xs font-bold leading-tight">Order & Help</span>
      </div>
    </motion.a>
  );
};

export default WhatsAppFloatingButton;
