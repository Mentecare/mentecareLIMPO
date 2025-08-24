import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Star,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function BookAppointment() {
  const { professionalId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [professional, setProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    type: 'consultation'
  });

  // Horários padrão de funcionamento (8h às 18h)
  const workingHours = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  useEffect(() => {
    console.log("useEffect acionado!"); // <--- ADICIONADO PARA DEBUG
    console.log("professionalId do useParams:", professionalId); // <--- ADICIONADO PARA DEBUG
    console.log("searchParams.get('professional'):", searchParams.get('professional')); // <--- ADICIONADO PARA DEBUG

    // Prioriza professionalId da URL, depois searchParams
    const idToFetch = professionalId || searchParams.get('professional');
    console.log("ID a ser buscado (idToFetch):", idToFetch); // <--- ADICIONADO PARA DEBUG

    if (idToFetch) {
      fetchProfessional(idToFetch);
    } else {
      toast.error('Profissional não especificado para agendamento.');
      navigate('/professionals');
    }
  }, [professionalId, searchParams, navigate]);

  useEffect(() => {
    if (selectedDate && professional) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, professional]);

  const fetchProfessional = async (profId) => {
    console.log("Chamando fetchProfessional com profId:", profId); // <--- ADICIONADO PARA DEBUG
    try {
      setLoading(true);
      const response = await axios.get(`/api/professionals/${profId}`);
      console.log("Resposta da API de profissional:", response.data); // <--- ADICIONADO PARA DEBUG
      setProfessional(response.data.professional);
    } catch (error) {
      console.error("Erro ao carregar profissional na função fetchProfessional:", error); // <--- ADICIONADO PARA DEBUG
      toast.error('Não foi possível carregar os dados do profissional. Redirecionando...');
      setProfessional(null); // Garante que o estado seja nulo em caso de erro
      navigate('/professionals'); // Redireciona em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!professional || !professional.id) { // Adiciona verificação aqui
      console.warn('Profissional não carregado para buscar horários disponíveis.');
      setAvailableSlots([]);
      return;
    }
    try {
      const response = await axios.get(`/api/professionals/${professional.id}/availability`, {
        params: { date }
      });
      
      const occupiedSlots = response.data.occupied_slots || [];
      const available = workingHours.filter(time => !occupiedSlots.includes(time));
      setAvailableSlots(available);
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
      // Em caso de erro, assumir que nenhum horário está disponível para evitar agendamentos incorretos
      setAvailableSlots([]);
      toast.error('Não foi possível carregar os horários disponíveis para esta data.');
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime(''); // Reset time selection when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Por favor, selecione uma data e horário.');
      return;
    }
    if (!professional || !professional.id) {
      toast.error('Dados do profissional ausentes. Por favor, tente novamente.');
      return;
    }

    try {
      setSubmitting(true);
      
      const appointmentData = {
        professional_id: professional.id,
        appointment_date: `${selectedDate} ${selectedTime}:00`,
        notes: formData.notes,
        type: formData.type
      };

      console.log('Enviando dados de agendamento:', appointmentData);

      const response = await axios.post('/api/appointments', appointmentData);
      
      if (response.data.success) {
        toast.success('Consulta agendada com sucesso!');
        navigate('/appointments');
      } else {
        toast.error(response.data.message || 'Erro ao agendar consulta.');
      }
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Não foi possível agendar a consulta. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 dias no futuro
    return maxDate.toISOString().split('T')[0];
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= (rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      );
    }
    return (
      <div className="flex items-center space-x-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">({(rating || 0).toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/professionals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Agendar Consulta</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Se professional for null após o carregamento, exibe mensagem de erro
  if (!professional) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/professionals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Agendar Consulta</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Profissional não encontrado ou erro ao carregar.
            </h3>
            <p className="text-gray-500 mb-4">
              Não foi possível carregar os dados do profissional. Por favor, tente novamente.
            </p>
            <Button onClick={() => navigate('/professionals')}>
              Voltar aos Profissionais
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/professionals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Agendar Consulta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Professional Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profissional</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{professional.name}</h3>
                <p className="text-sm text-gray-500">{professional.specialty}</p>
                {professional.crp && (
                  <Badge variant="secondary" className="mt-1">
                    {professional.crp}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div>
                {renderStars(professional.rating)}
              </div>

              {/* Bio */}
              {professional.bio && (
                <div>
                  <p className="text-sm text-gray-600">{professional.bio}</p>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center space-x-1 text-lg font-medium text-green-600">
                <DollarSign className="h-5 w-5" />
                <span>R$ {(professional.consultation_price || 0).toFixed(2)}</span>
              </div>

              {/* Stats */}
              <div className="text-sm text-gray-500">
                <p>{professional.total_consultations || 0} consultas realizadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Agendar Consulta</span>
              </CardTitle>
              <CardDescription>
                Selecione uma data e horário disponível para sua consulta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label htmlFor="date">Data da Consulta</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione uma data entre amanhã e os próximos 30 dias
                  </p>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label>Horário Disponível</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTimeSelect(time)}
                            className="text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </Button>
                        ))
                      ) : (
                        <div className="col-span-4 text-center py-4 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>Nenhum horário disponível para esta data</p>
                          <p className="text-xs">Tente selecionar outra data</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Observações (Opcional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Descreva brevemente o motivo da consulta ou alguma observação importante..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/professionals')}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedDate || !selectedTime || submitting}
                    className="min-w-32"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Agendando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirmar Agendamento</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;
