import React, { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const TestConnection = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Aguardando permissão...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const startStream = async () => {
      try {
        setStatus('Solicitando acesso à câmera e microfone...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('Câmera e microfone funcionando! Você pode se ver e ouvir.');
          toast.success('Conexão de vídeo e áudio estabelecida com sucesso!');
        }
      } catch (err) {
        console.error('Erro ao acessar mídia:', err);
        setError(err.name === 'NotAllowedError' ? 'Permissão negada para câmera/microfone. Por favor, permita o acesso nas configurações do navegador.' : 'Não foi possível acessar a câmera ou microfone. Verifique se estão conectados e não estão sendo usados por outro aplicativo.');
        setStatus('Erro ao iniciar a conexão.');
        toast.error('Erro ao acessar câmera/microfone. Verifique as permissões.');
      }
    };

    startStream();

    // Limpeza ao desmontar o componente
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Teste de Conexão de Vídeo e Áudio</h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <p className="text-lg text-gray-700 mb-4">Status: <span className="font-semibold">{status}</span></p>
        {error && <p className="text-red-600 mb-4">Erro: {error}</p>}
        <div className="relative w-full pt-[56.25%] bg-gray-300 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"></video>
        </div>
        <p className="text-sm text-gray-500 mt-4">Certifique-se de que sua câmera e microfone estão funcionando corretamente. Se você não conseguir se ver ou ouvir, verifique as permissões do navegador e as configurações do seu dispositivo.</p>
      </div>
    </div>
  );
};

export default TestConnection;
