/**
 * Módulo de gerenciamento de cookies para persistência de sessão
 * Implementa sliding expiration: cada vez que o usuário abre o app, renova por +30 dias
 */

const COOKIE_EXPIRATION_DAYS = 30;

// Nomes dos cookies de autenticação
const AUTH_COOKIES = {
  TOKEN: 'auth_token',
  TITULAR: 'auth_titular',
  PATIENT_DATA: 'auth_patient_data',
  LIST_TO_SCHEDULE: 'auth_list_to_schedule',
  RATING: 'auth_rating',
} as const;

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
 * Salva dados de autenticação nos cookies
 * Chamado após login bem-sucedido
 */
export const saveAuthToCookies = (data: {
  token: string;
  titular: any;
  patientData: any;
  listToSchedule: any[];
  rating?: string;
}): void => {
  try {
    setCookie(AUTH_COOKIES.TOKEN, data.token, COOKIE_EXPIRATION_DAYS);
    setCookie(AUTH_COOKIES.TITULAR, JSON.stringify(data.titular), COOKIE_EXPIRATION_DAYS);
    setCookie(AUTH_COOKIES.PATIENT_DATA, JSON.stringify(data.patientData), COOKIE_EXPIRATION_DAYS);
    setCookie(AUTH_COOKIES.LIST_TO_SCHEDULE, JSON.stringify(data.listToSchedule), COOKIE_EXPIRATION_DAYS);
    
    if (data.rating) {
      setCookie(AUTH_COOKIES.RATING, data.rating, COOKIE_EXPIRATION_DAYS);
    }
    
    console.log('[CookieStorage] Dados de autenticação salvos nos cookies');
  } catch (error) {
    console.error('[CookieStorage] Erro ao salvar dados nos cookies:', error);
  }
};

/**
 * Recupera dados de autenticação dos cookies
 * Retorna null se não houver dados ou se estiverem inválidos
 */
export const getAuthFromCookies = (): {
  token: string;
  titular: any;
  patientData: any;
  listToSchedule: any[];
  rating: string;
} | null => {
  try {
    const token = getCookie(AUTH_COOKIES.TOKEN);
    const titularStr = getCookie(AUTH_COOKIES.TITULAR);
    const patientDataStr = getCookie(AUTH_COOKIES.PATIENT_DATA);
    const listToScheduleStr = getCookie(AUTH_COOKIES.LIST_TO_SCHEDULE);
    const rating = getCookie(AUTH_COOKIES.RATING);
    
    // Se não houver token, não há sessão válida
    if (!token) {
      return null;
    }
    
    // Parse dos dados JSON
    const titular = titularStr ? JSON.parse(titularStr) : null;
    const patientData = patientDataStr ? JSON.parse(patientDataStr) : null;
    const listToSchedule = listToScheduleStr ? JSON.parse(listToScheduleStr) : [];
    
    // Verifica se os dados essenciais existem
    if (!titular || !patientData) {
      return null;
    }
    
    console.log('[CookieStorage] Dados de autenticação recuperados dos cookies');
    
    return {
      token,
      titular,
      patientData,
      listToSchedule,
      rating: rating || '0',
    };
  } catch (error) {
    console.error('[CookieStorage] Erro ao recuperar dados dos cookies:', error);
    return null;
  }
};

/**
 * Renova a expiração de todos os cookies de autenticação
 * Implementa sliding expiration: cada abertura do app renova por +30 dias
 */
export const renewAuthCookies = (): boolean => {
  try {
    const authData = getAuthFromCookies();
    
    if (!authData) {
      console.log('[CookieStorage] Nenhum dado de autenticação para renovar');
      return false;
    }
    
    // Re-salva os dados com nova expiração
    saveAuthToCookies(authData);
    
    console.log('[CookieStorage] Expiração dos cookies renovada por mais 30 dias');
    return true;
  } catch (error) {
    console.error('[CookieStorage] Erro ao renovar cookies:', error);
    return false;
  }
};

/**
 * Limpa todos os cookies de autenticação
 * Chamado no logout
 */
export const clearAuthCookies = (): void => {
  try {
    Object.values(AUTH_COOKIES).forEach(cookieName => {
      deleteCookie(cookieName);
    });
    
    console.log('[CookieStorage] Cookies de autenticação removidos');
  } catch (error) {
    console.error('[CookieStorage] Erro ao limpar cookies:', error);
  }
};

/**
 * Verifica se existe uma sessão válida nos cookies
 */
export const hasValidCookieSession = (): boolean => {
  const token = getCookie(AUTH_COOKIES.TOKEN);
  return !!token;
};
