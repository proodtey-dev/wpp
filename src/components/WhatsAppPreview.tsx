import React from 'react';

interface WhatsAppPreviewProps {
  message: string;
  businessName?: string;
}

const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ message, businessName = 'Nome do Comércio' }) => {
  const formattedMessage = message.replace(/{nome}/g, businessName);
  
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      className="bg-[#efeae2] w-full rounded-3xl overflow-hidden shadow-xl"
      style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}
    >
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-xl font-bold">
          {businessName.charAt(0)}
        </div>
        <div>
          <div className="font-semibold">{businessName}</div>
          <div className="text-xs text-white/70">visto por último hoje às {time}</div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4 min-h-[300px] flex flex-col justify-end">
        <div className="bg-[#d9fdd3] text-[#111b21] p-2 px-3 rounded-xl rounded-tr-none max-w-[85%] self-end shadow-sm relative">
          <p className="whitespace-pre-wrap text-sm leading-relaxed mb-4">{formattedMessage}</p>
          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-[rgba(17,27,33,0.5)]">
            <span>{time}</span>
            <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
              <path d="M11.8 1L11.5 1.3L5.4 7.4L3 5L2.6 4.6L1.2 6L1.6 6.4L5.4 10.2L13.2 2.4L13.6 2L12.2 0.6L11.8 1ZM15.4 2.4L15.8 2L14.4 0.6L14 1L13.7 1.3L15.4 3L15.4 2.4ZM8.4 7.4L8.7 7.7L9.4 7L9 6.6L8.4 7.4ZM4.4 10.2L4.8 10.6L5.5 9.9L5.1 9.5L4.4 10.2Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPreview;
