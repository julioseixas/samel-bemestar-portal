import { jwtDecode } from "jwt-decode";
import { getCookie } from "@/lib/cookie-storage";

/**
 * Obtém o token de autenticação do localStorage ou cookies (fallback)
 */
const getAuthToken = (): string => {
  // Primeiro tenta localStorage
  let userToken = localStorage.getItem("user");
  
  // Fallback para cookies se localStorage estiver vazio
  if (!userToken) {
    userToken = getCookie("auth_token");
  }
  
  if (!userToken) {
    throw new Error("Token de autenticação não encontrado");
  }
  
  return userToken;
};

/**
 * Retorna os headers padrão para requisições à API Samel
 * Inclui automaticamente o token de autenticação decodificado
 */
export const getApiHeaders = (): HeadersInit => {
  const userToken = getAuthToken();

  try {
    const decoded: any = jwtDecode(userToken);
    const authToken = decoded.token || userToken;

    return {
      "Content-Type": "application/json",
      "identificador-dispositivo": "request-android",
      "chave-autenticacao": authToken
    };
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    throw new Error("Token de autenticação inválido");
  }
};

/**
 * Retorna headers básicos sem autenticação
 * Use apenas quando explicitamente solicitado
 */
export const getBasicHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
    "identificador-dispositivo": "request-android",
  };
};
