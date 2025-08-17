import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  Users,
  MessageCircle,
  Monitor,
  Camera,
  Volume2,
  VolumeX
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

function VideoCall() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  // Video controls
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  
  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRoomData();
    return () => {
      cleanup();
    };
  }, [roomId, user]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/video/room/${roomId}`);
      setRoomData(response.data);
      initializeVideoCall();
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao acessar sala de vídeo';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const initializeVideoCall = async () => {
    try {
      // Base URL para o Socket.IO, deve ser a mesma da API
      const socketBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      // Remove o '/api' do final para a conexão do socket
      const socketUrl = socketBaseUrl.endsWith('/api') ? socketBaseUrl.slice(0, -4) : socketBaseUrl;

      socketRef.current = io(socketUrl, {
        transports: ['websocket'],
        auth: { token: localStorage.getItem('token') } // Envia o token JWT no handshake
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        joinRoom();
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO Connection Error:', err.message);
        toast.error('Erro de conexão com o servidor de vídeo.');
        setError('Erro de conexão com o servidor de vídeo.');
        setLoading(false);
      });

      socketRef.current.on('user_joined', (data) => {
        toast.success(`${data.user_id} entrou na sala`);
        setParticipants(prev => [...prev, data.user_id]);
      });

      socketRef.current.on('user_left', (data) => {
        toast.info(`${data.user_id} saiu da sala`);
        setParticipants(prev => prev.filter(id => id !== data.user_id));
      });

      socketRef.current.on('video_signal', handleVideoSignal);

      // Inicializar mídia local
      await initializeLocalMedia();
      
    } catch (error) {
      console.error('Erro ao inicializar videochamada:', error);
      toast.error('Erro ao inicializar videochamada');
      setError('Erro ao inicializar videochamada.');
      setLoading(false);
    }
  };

  const initializeLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
    } catch (error) {
      console.error('Erro ao acessar mídia:', error);
      toast.error('Erro ao acessar câmera e microfone. Verifique as permissões.');
      setError('Erro ao acessar câmera e microfone. Verifique as permissões.');
    }
  };

  const joinRoom = () => {
    if (socketRef.current && roomId && user) {
      socketRef.current.emit('join_room', {
        room_id: roomId,
        user_id: user.id,
        user_name: user.name // Envia o nome do usuário para exibição
      });
    }
  };

  const leaveRoom = () => {
    if (socketRef.current && roomId && user) {
      socketRef.current.emit('leave_room', {
        room_id: roomId,
        user_id: user.id
      });
    }
  };

  const handleVideoSignal = (data) => {
    // Aqui seria implementada a lógica WebRTC real
    // Por simplicidade, vamos simular
    console.log('Sinal de vídeo recebido:', data);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const endCall = async () => {
    try {
      if (user.user_type === 'professional') {
        await axios.post(`/video/room/${roomId}/end`);
        toast.success('Consulta finalizada com sucesso');
      } else {
        // Paciente apenas sai da sala, não 'finaliza' a consulta
        toast.info('Você saiu da consulta.');
      }
      
      cleanup();
      navigate('/appointments');
    } catch (error) {
      console.error('Erro ao finalizar chamada:', error);
      toast.error('Erro ao finalizar chamada');
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (socketRef.current) {
      leaveRoom();
      socketRef.current.disconnect();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/appointments')}>
              Voltar para Consultas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Consulta - {roomData?.appointment?.professional_name || roomData?.appointment?.patient_name}
            </h1>
            <p className="text-sm text-gray-600">
              {roomData?.appointment && format(
                new Date(roomData.appointment.appointment_date), 
                "dd 'de' MMMM 'às' HH:mm", 
                { locale: ptBR }
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? 'success' : 'destructive'}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {participants.length + 1} participantes
            </Badge>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ display: participants.length > 0 ? 'block' : 'none' }}
          />
          
          {participants.length === 0 && (
            <div className="text-center text-white">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aguardando outro participante...</p>
              <p className="text-sm opacity-75">
                {user.user_type === 'patient' 
                  ? 'O profissional entrará em breve'
                  : 'Aguardando o paciente entrar na sala'
                }
              </p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: isVideoEnabled ? 'block' : 'none' }}
          />
          
          {!isVideoEnabled && (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs">
              Você
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center items-center space-x-4">
          {/* Audio Toggle */}
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-12 h-12"
            onClick={endCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Chat */}
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Call Info */}
        <div className="text-center mt-4">
          <p className="text-white text-sm">
            {isCallActive ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Chamada ativa
              </>
            ) : (
              'Conectando...'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;


