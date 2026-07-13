import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (config) => {
  let key = config.url || '';
  if (config.params) {
    try {
      key += '?' + new URLSearchParams(config.params).toString();
    } catch (e) {
      key += '?' + JSON.stringify(config.params);
    }
  }
  return key;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  // Clear cache on write transactions to avoid stale state
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    cache.clear();
  }

  // Return cached data if available and fresh (SWR Pattern)
  if (config.method?.toLowerCase() === 'get' && !config.headers['X-Bypass-Cache']) {
    const cacheKey = getCacheKey(config);
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      // Fetch in background to keep cache fresh for next time
      const backgroundConfig = { 
        ...config, 
        headers: { ...config.headers, 'X-Bypass-Cache': 'true' }
      };
      delete backgroundConfig.adapter;
      
      axios(backgroundConfig).then(response => {
        cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }).catch(() => {});

      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config
      });
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    const { config } = response;
    if (config.method?.toLowerCase() === 'get') {
      const cacheKey = getCacheKey(config);
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    if (!config) return Promise.reject(error);

    if (config.retry === undefined) {
      config.retry = 0;
    }

    const MAX_RETRIES = 2;
    const isNetworkError = !response;
    const isServerError = response && (response.status >= 500 && response.status <= 504);

    if ((isNetworkError || isServerError) && config.retry < MAX_RETRIES) {
      config.retry += 1;
      const backoffDelay = config.retry * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      delete config.adapter; // ensure retry uses the actual network adapter
      return api(config);
    }

    return Promise.reject(error);
  }
);

export const handleServiceError = (error, defaultMessage) => {
  if (error.response && error.response.data) {
    let msg = error.response.data.message || defaultMessage;
    if (error.response.data.errors) {
      const errs = error.response.data.errors;
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        const errorDetail = errs[firstKey];
        msg = `${msg}: ${Array.isArray(errorDetail) ? errorDetail[0] : errorDetail}`;
      }
    }
    throw new Error(msg);
  }
  throw new Error(defaultMessage);
};

export default api;