/**
 * Módulo de gerenciamento de cookies para persistência de sessão
 * Implementa sliding expiration: cada vez que o usuário abre o app, renova por +30 dias
 * 
 * IMPORTANTE: Para evitar erro "Request Header Or Cookie Too Large" (erro 400),
 * salvamos apenas o token JWT no cookie. Os dados completos são extraídos do JWT
 * ao restaurar a sessão.
 */

import { jwtDecode } from 'jwt-decode';

const COOKIE_EXPIRATION_DAYS = 30;

// Nome do cookie de autenticação (apenas o token)
const AUTH_TOKEN_COOKIE = 'auth_token';

/**
 * Define um cookie com expiração em dias
 */
export const setCookie = (name: string, value: string, days: number = COOKIE_EXPIRATION_DAYS): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Encode o valor para evitar problemas com caracteres especiais
  const encodedValue = encodeURIComponent(value);
  
  // Configurações de segurança do cookie
  // SameSite=Lax para compatibilidade com WebViews
  // Secure apenas em HTTPS (produção)
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  
  document.cookie = `${name}=${encodedValue}; expires=${expires.toUTCString()}; path=/${secureFlag}; SameSite=Lax`;
};

/**
 * Obtém o valor de um cookie pelo nome
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      const value = cookie.substring(nameEQ.length);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
};

/**
 * Remove um cookie pelo nome
 */
export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/**
 * Limpa cookies antigos que podem estar causando problemas
 * Remove cookies grandes que eram usados na versão anterior
 */
const clearLegacyCookies = (): void => {
  const legacyCookies = [
    'auth_titular',
    'auth_patient_data', 
    'auth_list_to_schedule',
    'auth_rating'
  ];
  
  legacyCookies.forEach(cookieName => {
    deleteCookie(cookieName);
  });
};

/**
 * Salva dados de autenticação nos cookies
 * OTIMIZADO: Salva apenas o token JWT para evitar erro de cookie muito grande
 * Os dados completos são extraídos do JWT ao restaurar a sessão
 */
export const saveAuthToCookies = (data: {
  token: string;
  titular?: any;
  patientData?: any;
  listToSchedule?: any[];
  rating?: string;
}): void => {
  try {
    // Limpa cookies antigos que podem estar causando o erro 400
    clearLegacyCookies();
    
    // Salva apenas o token JWT (que já contém todas as informações necessárias)
    setCookie(AUTH_TOKEN_COOKIE, data.token, COOKIE_EXPIRATION_DAYS);
  } catch (error) {
    // Error saving auth to cookies
  }
};

/**
 * Recupera dados de autenticação dos cookies
 * OTIMIZADO: Extrai dados diretamente do JWT armazenado no cookie
 */
export const getAuthFromCookies = (): {
  token: string;
  titular: any;
  patientData: any;
  listToSchedule: any[];
  rating: string;
} | null => {
  try {
    const token = getCookie(AUTH_TOKEN_COOKIE);
    
    // Se não houver token, não há sessão válida
    if (!token) {
      return null;
    }
    
    // Decodifica o JWT para extrair os dados
    const decoded: any = jwtDecode(token);
    
    // Reconstrói os dados a partir do JWT (mesma lógica do Login.tsx)
    const titularCompleto = decoded.clienteContratos?.[0] || {};
    
    const cdPessoaFisica = decoded.cdPessoaFisica || 
                           decoded.cd_pessoa_fisica || 
                           titularCompleto.cdPessoaFisica || 
                           titularCompleto.cd_pessoa_fisica || 
                           decoded.id;
    
    const titular = {
      ...titularCompleto,
      tipoBeneficiario: decoded.tipoBeneficiario || titularCompleto.tipoBeneficiario,
      nome: decoded.nome || titularCompleto.nome,
      id: decoded.id || titularCompleto.id,
      cpf: decoded.cpf || titularCompleto.cpf,
      codigoCarteirinha: decoded.codigoCarteirinha || titularCompleto.codigoCarteirinha || null,
      idade: decoded.idade || titularCompleto.idade,
      sexo: decoded.sexo || titularCompleto.sexo,
      email: decoded.usuario?.email || decoded.email || titularCompleto.email,
      idUsuario: decoded.usuario?.id || titularCompleto.idUsuario,
      clienteContratos: decoded.clienteContratos,
      ieGravida: decoded.ieGravida || titularCompleto.ieGravida,
      rating: decoded.rating || titularCompleto.rating,
      tipo: "Titular",
      cdPessoaFisica: cdPessoaFisica
    };
    
    const listToSchedule: any[] = [titular];

    if (decoded.dependentes && decoded.dependentes.length > 0) {
      decoded.dependentes.forEach((dependente: any) => {
        listToSchedule.push({
          ...dependente,
          tipo: "Dependente",
          cpf: dependente.cpf
        });
      });
    }
    
    return {
      token,
      titular,
      patientData: decoded,
      listToSchedule,
      rating: titular.rating?.toString() || '0',
    };
  } catch (error) {
    return null;
  }
};

/**
 * Renova a expiração do cookie de autenticação
 * Implementa sliding expiration: cada abertura do app renova por +30 dias
 */
export const renewAuthCookies = (): boolean => {
  try {
    const token = getCookie(AUTH_TOKEN_COOKIE);
    
    if (!token) {
      return false;
    }
    
    // Limpa cookies antigos primeiro
    clearLegacyCookies();
    
    // Re-salva o token com nova expiração
    setCookie(AUTH_TOKEN_COOKIE, token, COOKIE_EXPIRATION_DAYS);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Limpa todos os cookies de autenticação
 * Chamado no logout
 */
export const clearAuthCookies = (): void => {
  try {
    // Remove o token atual
    deleteCookie(AUTH_TOKEN_COOKIE);
    
    // Remove também cookies legados que podem existir
    clearLegacyCookies();
  } catch (error) {
    // Error clearing auth cookies
  }
};

/**
 * Verifica se existe uma sessão válida nos cookies
 */
export const hasValidCookieSession = (): boolean => {
  const token = getCookie(AUTH_TOKEN_COOKIE);
  return !!token;
};
