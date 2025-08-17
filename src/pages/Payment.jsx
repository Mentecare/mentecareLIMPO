import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Copy,
  QrCode
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

function Payment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [pixData, setPixData] = useState(null);
  
  // Form data for card payment
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    fetchAppointmentData();
    fetchPaymentMethods();
  }, [appointmentId]);

  const fetchAppointmentData = async () => {
    try {
      const response = await axios.get(`/appointments/${appointmentId}`);
      setAppointment(response.data.appointment);
      if (response.data.appointment.payment) {
        setPayment(response.data.appointment.payment);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do agendamento:', error);
      toast.error('Erro ao carregar dados do agendamento');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payments/methods');
      setPaymentMethods(response.data.payment_methods);
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
    }
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'number') {
      // Formatar número do cartão (XXXX XXXX XXXX XXXX)
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    } else if (field === 'expiry') {
      // Formatar data de expiração (MM/YY)
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    } else if (field === 'cvv') {
      // Limitar CVV a 4 dígitos
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const generatePix = async () => {
    try {
      setProcessing(true);
      const response = await axios.post('/payments/pix/generate', {
        payment_id: payment.id
      });
      
      setPixData(response.data);
      toast.success('Código PIX gerado com sucesso!');
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao gerar PIX';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = async () => {
    try {
      setProcessing(true);
      
      const paymentData = {
        payment_method: selectedMethod,
        card_data: selectedMethod.includes('card') ? cardData : undefined
      };

      const response = await axios.post(`/payments/${payment.id}/process`, paymentData);
      
      toast.success('Pagamento processado com sucesso!');
      
      // Atualizar dados do pagamento
      setPayment(response.data.payment);
      
      // Redirecionar para consultas após alguns segundos
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
      
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao processar pagamento';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.pix_code) {
      navigator.clipboard.writeText(pixData.pix_code);
      toast.success('Código PIX copiado!');
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
      completed: { label: 'Pago', variant: 'success', icon: CheckCircle },
      failed: { label: 'Falhou', variant: 'destructive', icon: XCircle }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: Clock };
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{statusInfo.label}</span>
      </Badge>
    );
  };

  const getMethodIcon = (methodId) => {
    const iconMap = {
      credit_card: CreditCard,
      debit_card: CreditCard,
      pix: Smartphone,
      boleto: FileText
    };
    return iconMap[methodId] || CreditCard;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!appointment || !payment) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Agendamento ou pagamento não encontrado.</p>
            <Button onClick={() => navigate('/appointments')}>
              Voltar para Consultas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o pagamento já foi processado
  if (payment.payment_status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              <span>Pagamento Confirmado</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Seu pagamento foi processado com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Valor pago:</p>
                  <p className="text-lg font-bold text-green-600">R$ {payment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Data do pagamento:</p>
                  <p>{format(new Date(payment.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => navigate('/appointments')} className="w-full">
                  Ir para Minhas Consultas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagamento da Consulta</h1>
        <p className="text-gray-600 mt-2">
          Complete o pagamento para confirmar sua consulta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>
                Escolha como você gostaria de pagar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = getMethodIcon(method.id);
                  return (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Card Payment Form */}
          {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cartão</CardTitle>
                <CardDescription>
                  Preencha os dados do seu cartão de {selectedMethod === 'credit_card' ? 'crédito' : 'débito'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card_number">Número do cartão</Label>
                  <Input
                    id="card_number"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => handleCardInputChange('number', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="card_name">Nome no cartão</Label>
                  <Input
                    id="card_name"
                    placeholder="Nome como está no cartão"
                    value={cardData.name}
                    onChange={(e) => handleCardInputChange('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_expiry">Validade</Label>
                    <Input
                      id="card_expiry"
                      placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card_cvv">CVV</Label>
                    <Input
                      id="card_cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={processPayment} 
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? 'Processando...' : `Pagar R$ ${payment.amount.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* PIX Payment */}
          {selectedMethod === 'pix' && (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento via PIX</CardTitle>
                <CardDescription>
                  Escaneie o QR Code ou copie o código PIX
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pixData ? (
                  <Button 
                    onClick={generatePix} 
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? 'Gerando...' : 'Gerar Código PIX'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center">
                        <QrCode className="h-24 w-24 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        QR Code para pagamento PIX
                      </p>
                    </div>

                    <div>
                      <Label>Código PIX (Copia e Cola)</Label>
                      <div className="flex space-x-2">
                        <Input
                          value={pixData.pix_code}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button onClick={copyPixCode} variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> O código PIX expira em 30 minutos. 
                        Após o pagamento, sua consulta será confirmada automaticamente.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boleto Payment */}
          {selectedMethod === 'boleto' && (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento via Boleto</CardTitle>
                <CardDescription>
                  Gere seu boleto bancário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    O boleto tem vencimento em 3 dias úteis. Após o pagamento, 
                    sua consulta será confirmada em até 2 dias úteis.
                  </p>
                </div>
                
                <Button 
                  onClick={processPayment} 
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? 'Gerando...' : 'Gerar Boleto'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{appointment.professional_name}</p>
                  <p className="text-sm text-gray-500">{appointment.professional_specialty}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span>{format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span>{format(new Date(appointment.appointment_date), "HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duração:</span>
                  <span>{appointment.duration_minutes} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span>Videochamada</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {payment.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status do pagamento:</span>
                {getPaymentStatusBadge(payment.payment_status)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações Importantes</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <p>• O pagamento deve ser realizado para confirmar a consulta</p>
              <p>• Você receberá um email de confirmação após o pagamento</p>
              <p>• A sala de videochamada estará disponível 15 minutos antes do horário</p>
              <p>• Em caso de problemas, entre em contato conosco</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Payment;

