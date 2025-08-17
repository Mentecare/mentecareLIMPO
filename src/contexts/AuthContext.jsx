import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configura a base URL para o Axios
  axios.defaults.baseURL = `${import.meta.env.VITE_API_URL}/api`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser(token);
    } else {
      setLoading(false);
    }

    // Interceptor para adicionar o token automaticamente
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de erros (401, 422)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          if (status === 401) {
            toast.error(data.message || 'Sessão expirada ou não autorizada. Faça login novamente.');
            logout();
          } else if (status === 422) {
            // Erro de validação
            const errors = data.errors || data.message || 'Erro de validação.';
            if (typeof errors === 'object') {
              Object.values(errors).forEach(msg => toast.error(msg));
            } else {
              toast.error(errors);
            }
          } else {
            toast.error(data.message || 'Ocorreu um erro inesperado.');
          }
        } else if (error.request) {
          toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
          toast.error('Erro desconhecido: ' + error.message);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      // Erro já tratado pelo interceptor
      console.error('Login failed:', error);
      throw error; // Re-throw para que o componente possa lidar com o estado de carregamento/erro
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      // Erro já tratado pelo interceptor
      console.error('Registration failed:', error);
      throw error; // Re-throw para que o componente possa lidar com o estado de carregamento/erro
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.info('Você foi desconectado.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

