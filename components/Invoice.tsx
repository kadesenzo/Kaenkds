
import React from 'react';
import { ServiceOrder, PaymentStatus } from '../types';
import { Wrench } from 'lucide-react';

interface InvoiceProps {
  os: ServiceOrder;
}

const Invoice: React.FC<InvoiceProps> = ({ os }) => {
  const totalItems = os.items.length + (os.laborValue > 0 ? 1 : 0);
  
  let densityClass = '';
  if (totalItems > 18) densityClass = 'micro-mode';
  else if (totalItems > 10) densityClass = 'compact-mode';

  return (
    <div className={`kaen-invoice-render ${densityClass}`}>
      <div className="inv-watermark">KAEN MECÂNICA</div>
      
      {/* Header */}
      <div className="inv-header">
        <div className="inv-logo-area">
          <div className="inv-logo-box">
            <Wrench size={36} />
          </div>
          <div className="inv-company-info">
            <h1>Kaen Mecânica</h1>
            <p>Rua Joaquim Marques Alves, 765 - São Paulo/SP</p>
            <p>CNPJ: 00.000.000/0001-00 • (11) 98765-4321</p>
          </div>
        </div>
        <div className="inv-os-info">
          <h2>Ordem de Serviço</h2>
          <p className="os-number">{os.osNumber}</p>
          <p className="os-date">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Client & Vehicle Info */}
      <div className="inv-client-card">
        <div className="inv-info-group">
          <label>Cliente</label>
          <span>{os.clientName}</span>
        </div>
        <div className="inv-info-group">
          <label>Telefone</label>
          <span>{os.clientPhone || 'Não informado'}</span>
        </div>
        <div className="inv-info-group">
          <label>Veículo</label>
          <span>{os.vehicleModel}</span>
        </div>
        <div className="inv-info-group">
          <label>Placa</label>
          <span>{os.vehiclePlate}</span>
        </div>
        <div className="inv-info-group">
          <label>Kilometragem</label>
          <span>{os.vehicleKm || '0'} KM</span>
        </div>
        <div className="inv-info-group">
          <label>Garantia</label>
          <span>90 Dias (Mão de Obra)</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="inv-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-desc">Descrição Técnica do Serviço / Peça</th>
              <th className="col-qtd">Qtd</th>
              <th className="col-unit">Unitário</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {os.items.map((item, idx) => (
              <tr key={idx}>
                <td className="col-desc">{item.description}</td>
                <td className="col-qtd">{item.quantity}</td>
                <td className="col-unit">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="col-total">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {os.laborValue > 0 && (
              <tr>
                <td className="col-desc">SMR - Serviço de Manutenção Relatada</td>
                <td className="col-qtd">1</td>
                <td className="col-unit">R$ {os.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="col-total">R$ {os.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="inv-footer">
        <div className="flex flex-col gap-8">
          <div className={`inv-status-box inline-block border ${os.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            Financeiro: {os.paymentStatus === PaymentStatus.PAGO ? 'Documento Quitado' : 'Pagamento Pendente'}
          </div>
          <div className="inv-signature">
            Declaro estar de acordo com os serviços prestados
          </div>
        </div>
        <div className="inv-total-box">
          <label>Valor Total do Investimento</label>
          <p className="total-value">R$ {os.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.6em]">Kaen Mecânica • Excelência em Performance • São Paulo/SP</p>
      </div>
    </div>
  );
};

export default Invoice;
