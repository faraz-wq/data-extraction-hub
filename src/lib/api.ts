// API client for document extraction platform

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://unflavored-chasity-noncontagiously.ngrok-free.dev';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface User {
  id: string;
  email: string;
  username: string;
}

interface LoginResponse extends AuthTokens {
  user: User;
}

interface RegisterResponse {
  user: User;
  api_key?: string;
}

interface Stats {
  total_requests: number;
  total_errors: number;
  total_documents: number;
  avg_response_time_ms: number;
  requests_last_24h: number;
}

interface Session {
  session_id: string;
  application_type: string;
  created_at: string;
  file_count: number;
}

interface SessionDetail extends Session {
  summary: Record<string, unknown>;
  bounding_boxes: BoundingBox[];
  citations: Citation[];
  documents: Document[];
}

interface BoundingBox {
  field: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Citation {
  field: string;
  text: string;
  page: number;
  confidence: number;
}

interface Document {
  id: string;
  filename: string;
  url: string;
}

interface Schema {
  schema_id: string;
  schema_name: string;
  description: string;
  fields: SchemaField[];
}

interface SchemaField {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

interface ApiKey {
  id: string;
  description: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
  total_requests: number;
}

interface LogEntry {
  method: string;
  path: string;
  status_code: number;
  processing_ms: number;
  timestamp: string;
  client_ip: string;
  error_message: string | null;
}

interface MetricPoint {
  timestamp: string;
  requests: number;
  errors: number;
  avg_ms: number;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.apiKey = localStorage.getItem('api_key');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useApiKey = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (useApiKey && this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      await this.refresh();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        throw new Error(`API Error: ${retryResponse.status}`);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('api_key', key);
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(response);
    return response;
  }

  async register(email: string, username: string, password: string): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async refresh(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    if (!response.ok) {
      this.clearAuth();
      throw new Error('Session expired');
    }
    const tokens = await response.json();
    this.setTokens(tokens);
  }

  async logout(): Promise<void> {
    await this.request('/v1/auth/logout', { method: 'POST' });
    this.clearAuth();
  }

  // Stats & Metrics
  async getStats(): Promise<Stats> {
    return this.request<Stats>('/v1/me/stats');
  }

  async getMetrics(start: string, end: string, groupBy: 'hour' | 'day'): Promise<MetricPoint[]> {
    return this.request<MetricPoint[]>(
      `/v1/me/metrics/requests?start=${start}&end=${end}&group_by=${groupBy}`
    );
  }

  // Sessions
  async getSessions(limit = 20, offset = 0): Promise<Session[]> {
    return this.request<Session[]>(`/v1/me/sessions/?limit=${limit}&offset=${offset}`);
  }

  async getSession(sessionId: string): Promise<SessionDetail> {
    return this.request<SessionDetail>(`/v1/me/sessions/${sessionId}`);
  }

  // Schemas
  async getSchemas(): Promise<Schema[]> {
    return this.request<Schema[]>('/v1/me/schemas');
  }

  async createSchema(schema: Omit<Schema, 'schema_id'>): Promise<Schema> {
    return this.request<Schema>('/v1/me/schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  }

  async updateSchema(schemaId: string, schema: Partial<Schema>): Promise<Schema> {
    return this.request<Schema>(`/v1/me/schemas/${schemaId}`, {
      method: 'PUT',
      body: JSON.stringify(schema),
    });
  }

  async deleteSchema(schemaId: string): Promise<void> {
    await this.request(`/v1/me/schemas/${schemaId}`, { method: 'DELETE' });
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    return this.request<ApiKey[]>('/v1/me/api-keys/');
  }

  async createApiKey(description: string): Promise<{ api_key: string }> {
    return this.request<{ api_key: string }>('/v1/me/api-keys/', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async revokeApiKey(keyId: string): Promise<void> {
    await this.request(`/v1/me/api-keys/${keyId}`, { method: 'DELETE' });
  }

  // Logs
  async getLogs(params: {
    limit?: number;
    offset?: number;
    errors_only?: boolean;
    min_processing_ms?: number;
    path_contains?: string;
  }): Promise<LogEntry[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.offset) query.set('offset', params.offset.toString());
    if (params.errors_only) query.set('errors_only', 'true');
    if (params.min_processing_ms) query.set('min_processing_ms', params.min_processing_ms.toString());
    if (params.path_contains) query.set('path_contains', params.path_contains);
    return this.request<LogEntry[]>(`/v1/me/logs?${query.toString()}`);
  }

  // Extract
  async extract(schemaId: string, files: File[]): Promise<SessionDetail> {
    const formData = new FormData();
    formData.append('schema_id', schemaId);
    files.forEach((file) => formData.append('files[]', file));

    const response = await fetch(`${API_BASE_URL}/v1/extract-custom`, {
      method: 'POST',
      headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Extraction failed: ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient();
export type { Stats, Session, SessionDetail, Schema, SchemaField, ApiKey, LogEntry, MetricPoint, User, BoundingBox, Citation };
