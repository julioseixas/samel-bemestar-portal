import { jwtDecode } from "jwt-decode";

/**
 * Retorna os headers padrão para requisições à API Samel
 * Inclui automaticamente o token de autenticação decodificado
 */
export const getApiHeaders = (): HeadersInit => {
  const userToken = localStorage.getItem("user") || "";
  
  if (!userToken) {
    throw new Error("Token de autenticação não encontrado");
  }

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
