import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Star,
  DollarSign,
  Phone
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProfessionalsSimple() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/professionals');
      setProfessionals(response.data.professionals || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast.error('Não foi possível carregar a lista de profissionais.');
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-600 mt-2">
            Encontre o profissional ideal para suas necessidades de saúde mental
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
        <p className="text-gray-600 mt-2">
          Encontre o profissional ideal para suas necessidades de saúde mental
        </p>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {professionals.length} profissionais encontrados
          </p>
        </div>

        {professionals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Não há profissionais cadastrados no momento.
              </p>
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
                    {professional.crp && (
                      <Badge variant="secondary" className="ml-2">
                        {professional.crp}
                      </Badge>
                    )}
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
                      <span>R$ {(professional.consultation_price || 0).toFixed(2)}</span>
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
                    <Button variant="outline" className="flex-1">
                      Ver Perfil
                    </Button>
                    <Link to={`/professionals/${professional.id}/book`} className="flex-1">
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

export default ProfessionalsSimple;

