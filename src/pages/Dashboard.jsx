import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Video,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  Phone
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // Redirecionar para login se o usuário não estiver autenticado
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, appointmentsResponse] = await Promise.all([
        axios.get('/appointments/stats'),
        axios.get('/appointments/upcoming')
      ]);

      setStats(statsResponse.data.stats);
      setUpcomingAppointments(appointmentsResponse.data.appointments);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // O interceptor do AuthContext já deve lidar com 401/422
      // Se for outro erro, exibe um toast genérico
      if (!error.response || (error.response.status !== 401 && error.response.status !== 422)) {
        toast.error('Não foi possível carregar os dados do dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: 'Agendada', variant: 'default' },
      in_progress: { label: 'Em andamento', variant: 'secondary' },
      completed: { label: 'Concluída', variant: 'success' },
      cancelled: { label: 'Cancelada', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user.user_type === 'patient'
            ? 'Gerencie suas consultas e acompanhe seu bem-estar mental.'
            : 'Acompanhe suas consultas e gerencie seus pacientes.'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Consultas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas as consultas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendadas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduled || 0}</div>
            <p className="text-xs text-muted-foreground">
              Próximas consultas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Consultas finalizadas
            </p>
          </CardContent>
        </Card>

        {user.user_type === 'professional' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faturamento
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats?.total_earnings?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total recebido
              </p>
            </CardContent>
          </Card>
        )}

        {user.user_type === 'patient' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Canceladas
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.cancelled || 0}</div>
              <p className="text-xs text-muted-foreground">
                Consultas canceladas
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.user_type === 'patient' && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/professionals">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Buscar Profissionais</span>
                </CardTitle>
                <CardDescription>
                  Encontre o profissional ideal para suas necessidades
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/appointments">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Minhas Consultas</span>
              </CardTitle>
              <CardDescription>
                Visualize e gerencie suas consultas
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/video/test">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-purple-600" />
                <span>Teste de Conexão</span>
              </CardTitle>
              <CardDescription>
                Teste sua câmera e microfone
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Próximas Consultas</span>
          </CardTitle>
          <CardDescription>
            Suas consultas agendadas para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma consulta agendada</p>
              {user.user_type === 'patient' && (
                <Link to="/professionals">
                  <Button className="mt-4">
                    Agendar Consulta
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {user.user_type === 'patient' ? (
                          <Users className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Users className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.user_type === 'patient'
                          ? appointment.professional_name
                          : appointment.patient_name
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointment_date).toLocaleString('pt-BR')}
                      </p>
                      {appointment.professional_specialty && (
                        <p className="text-xs text-gray-400">
                          {appointment.professional_specialty}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(appointment.status)}
                    {/* Apenas mostra o botão de entrar se a consulta estiver agendada ou em andamento */}
                    {(appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
                      <Link to={`/video/${appointment.video_room_id}`}>
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4 mr-1" />
                          Entrar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Profile Card (for professionals) */}
      {user.user_type === 'professional' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Meu Perfil Profissional</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Informações Básicas</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Especialidade:</span> {user.specialty}</p>
                  <p><span className="font-medium">Registro:</span> {user.crp}</p>
                  <p><span className="font-medium">Preço da consulta:</span> R$ {user.consultation_price?.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Estatísticas</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Avaliação:</span> ⭐ {user.rating}/5.0</p>
                  <p><span className="font-medium">Total de consultas:</span> {user.total_consultations}</p>
                </div>
              </div>
            </div>
            {user.bio && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Biografia</h3>
                <p className="text-sm text-gray-600">{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;

