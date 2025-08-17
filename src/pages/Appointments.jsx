import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  Video,
  User,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import axios from 'axios';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

function Appointments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    page: 1
  });

  // Form data for new appointment
  const [appointmentForm, setAppointmentForm] = useState({
    professional_id: searchParams.get('professional') || '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    payment_method: 'credit_card'
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAppointments();
    if (user.user_type === 'patient') {
      fetchProfessionals();
    }
  }, [filters, user]);

  useEffect(() => {
    // Se veio da página de profissionais com um profissional selecionado
    if (searchParams.get('professional')) {
      setShowNewAppointment(true);
    }
  }, [searchParams]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);

      const response = await axios.get(`/appointments?${params}`);
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      if (!error.response || (error.response.status !== 401 && error.response.status !== 422)) {
        toast.error('Não foi possível carregar a lista de agendamentos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const response = await axios.get('/professionals');
      setProfessionals(response.data.professionals);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      if (!error.response || (error.response.status !== 401 && error.response.status !== 422)) {
        toast.error('Não foi possível carregar a lista de profissionais para agendamento.');
      }
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    try {
      const appointmentDateTime = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`);
      
      const appointmentData = {
        professional_id: parseInt(appointmentForm.professional_id),
        appointment_date: appointmentDateTime.toISOString(),
        notes: appointmentForm.notes,
        payment_method: appointmentForm.payment_method
      };

      const response = await axios.post('/appointments', appointmentData);
      
      toast.success('Agendamento criado com sucesso!');
      setShowNewAppointment(false);
      setAppointmentForm({
        professional_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
        payment_method: 'credit_card'
      });
      
      // Redirecionar para pagamento se necessário
      if (response.data.payment) {
        navigate(`/payment/${response.data.appointment.id}`);
      } else {
        fetchAppointments();
      }
    } catch (error) {
      // Erro já tratado pelo interceptor
      console.error('Erro ao criar agendamento:', error);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.put(`/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      
      toast.success('Status atualizado com sucesso!');
      fetchAppointments();
    } catch (error) {
      // Erro já tratado pelo interceptor
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: 'Agendada', variant: 'default', icon: Clock },
      in_progress: { label: 'Em andamento', variant: 'secondary', icon: Play },
      completed: { label: 'Concluída', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive', icon: XCircle }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: AlertCircle };
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{statusInfo.label}</span>
      </Badge>
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getMinDate = () => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Ou um componente de carregamento/redirecionamento
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Consultas</h1>
          <p className="text-gray-600 mt-2">
            {user.user_type === 'patient'
              ? 'Gerencie suas consultas agendadas'
              : 'Acompanhe suas consultas com pacientes'
            }
          </p>
        </div>
        
        {user.user_type === 'patient' && (
          <Button onClick={() => setShowNewAppointment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        )}
      </div>

      {/* New Appointment Form */}
      {showNewAppointment && user.user_type === 'patient' && (
        <Card>
          <CardHeader>
            <CardTitle>Agendar Nova Consulta</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para agendar sua consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="professional_id">Profissional</Label>
                  <Select 
                    value={appointmentForm.professional_id} 
                    onValueChange={(value) => setAppointmentForm({...appointmentForm, professional_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id.toString()}>
                          <div className="flex flex-col">
                            <span>{prof.name}</span>
                            <span className="text-xs text-gray-500">{prof.specialty} - R$ {prof.consultation_price?.toFixed(2)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Select 
                    value={appointmentForm.payment_method} 
                    onValueChange={(value) => setAppointmentForm({...appointmentForm, payment_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment_date">Data</Label>
                  <Input
                    id="appointment_date"
                    type="date"
                    min={getMinDate()}
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="appointment_time">Horário</Label>
                  <Select 
                    value={appointmentForm.appointment_time} 
                    onValueChange={(value) => setAppointmentForm({...appointmentForm, appointment_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Descreva brevemente o motivo da consulta ou informações importantes..."
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit">
                  Agendar Consulta
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewAppointment(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="scheduled">Agendadas</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                {user.user_type === 'patient'
                  ? 'Você ainda não tem consultas agendadas.'
                  : 'Você ainda não tem consultas com pacientes.'
                }
              </p>
              {user.user_type === 'patient' && (
                <Button onClick={() => setShowNewAppointment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeira Consulta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {user.user_type === 'patient'
                            ? appointment.professional_name
                            : appointment.patient_name
                          }
                        </h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {appointment.professional_specialty && (
                          <p className="text-xs text-gray-400">
                            {appointment.professional_specialty}
                          </p>
                        )}
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(appointment.status)}
                      
                      {appointment.status === 'scheduled' && (
                        <div className="flex space-x-2">
                          <Link to={`/video/${appointment.video_room_id}`}>
                            <Button size="sm">
                              <Video className="h-4 w-4 mr-1" />
                              Entrar
                            </Button>
                          </Link>
                          
                          {user.user_type === 'patient' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      )}

                      {appointment.status === 'in_progress' && (
                        <Link to={`/video/${appointment.video_room_id}`}>
                          <Button size="sm">
                            <Video className="h-4 w-4 mr-1" />
                            Continuar
                          </Button>
                        </Link>
                      )}

                      {appointment.status === 'completed' && (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" /> Concluída
                        </Badge>
                      )}

                      {appointment.status === 'cancelled' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Cancelada
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;


