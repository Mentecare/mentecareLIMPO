import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Phone
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProfessionalsFixed() {
  const [professionals, setProfessionals] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    specialty: '',
    min_price: '',
    max_price: '',
    min_rating: ''
  });

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchProfessionals();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [filters]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('q', filters.search);
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.min_rating) params.append('min_rating', filters.min_rating);

      const endpoint = filters.search ? '/professionals/search' : '/professionals';
      const response = await axios.get(`${endpoint}?${params}`);
      
      setProfessionals(response.data.professionals || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      if (!error.response || (error.response.status !== 401 && error.response.status !== 422)) {
        toast.error('Não foi possível carregar a lista de profissionais.');
      }
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get('/professionals/specialties');
      setSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
      if (!error.response || (error.response.status !== 401 && error.response.status !== 422)) {
        toast.error('Não foi possível carregar as especialidades.');
      }
      setSpecialties([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      min_price: '',
      max_price: '',
      min_rating: ''
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating ? rating.toFixed(1) : '0.0'})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
        <p className="text-gray-600 mt-2">
          Encontre o profissional ideal para suas necessidades de saúde mental
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou especialidade..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={filters.specialty} onValueChange={(value) => handleFilterChange('specialty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="number"
                placeholder="Preço mín. (R$)"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
            </div>

            <div>
              <Input
                type="number"
                placeholder="Preço máx. (R$)"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <Select value={filters.min_rating} onValueChange={(value) => handleFilterChange('min_rating', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Avaliação mínima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Qualquer avaliação</SelectItem>
                  <SelectItem value="4.5">4.5+ estrelas</SelectItem>
                  <SelectItem value="4.0">4.0+ estrelas</SelectItem>
                  <SelectItem value="3.5">3.5+ estrelas</SelectItem>
                  <SelectItem value="3.0">3.0+ estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${professionals.length} profissionais encontrados`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : professionals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar os filtros de busca para encontrar mais resultados.
              </p>
              <Button onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional) => (
              <Card key={professional.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{professional.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {professional.specialty}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {professional.crp}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div>
                    {renderStars(professional.rating)}
                  </div>

                  {/* Bio */}
                  {professional.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {professional.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{professional.total_consultations || 0} consultas</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {professional.consultation_price?.toFixed(2) || '0,00'}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  {professional.phone && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Phone className="h-4 w-4" />
                      <span>{professional.phone}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link to={`/professionals/${professional.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Ver Perfil
                      </Button>
                    </Link>
                    <Link to={`/appointments/new?professional=${professional.id}`} className="flex-1">
                      <Button className="w-full">
                        <Calendar className="h-4 w-4 mr-1" />
                        Agendar
                      </Button>
                    </Link>
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

export default ProfessionalsFixed;

