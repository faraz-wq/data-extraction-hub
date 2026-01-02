// API client for document extraction platform

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

interface SessionDetail {
  session_id: string;
  application_type: string;
  created_at: string;
  file_count: number;
  // UI helper fields
  issues: any[];
  summary: Record<string, unknown>;
  bounding_boxes: Record<string, BoundingBox[]>;
  citations: Record<string, string | string[] | null>;
  documents: Document[];
  source_documents?: Array<{ filename: string; document_title: string; page_numbers: number[] }>;
  field_remarks?: Record<string, string>;
  errors?: any[];
  validation_summary?: string;
  page_text?: Record<string, string>;
  unmapped_summary?: Record<string, unknown>;
}

interface BoundingBox {
  filename: string;
  page: number;
  coordinates: number[];
  document_title?: string;
}

interface Document {
  id: string;
  filename: string;
  url: string;
  page_numbers?: number[];
}

interface ValidationIssue {
  schema_field?: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  extracted_value: unknown;
  expected_value: unknown;
  source_citation?: string;
  requires_review: boolean;
}

// Universal Extraction Types (Strict)
interface FieldEntity {
  field_id: string;
  field_name: string;
  field_value: any;
  document: { filename: string; page: number; document_type: string };
  citation: { bounding_box: string[] | number[][]; text_snippet: string };
  role: 'application_claim' | 'proof' | 'contextual';
  confidence: number;
}

interface SchemaProjectionItem {
  schema_field: string;
  value: any;
  derived_from: string[];
  confidence: number;
  reasoning: string;
}

interface ValidationSummary {
  total_schema_fields: number;
  validated_fields: number;
  errors: number;
  warnings: number;
  confidence_score: number;
}

interface UniversalResponse {
  application_type: string;
  documents: any[];
  field_entities: FieldEntity[];
  field_relationships: any[];
  schema_projection: {
    schema_name: string;
    ordered_fields: SchemaProjectionItem[];
    unmapped_fields: FieldEntity[];
  };
  validation_summary: ValidationSummary;
  issues: ValidationIssue[];
  metadata: Record<string, any>;
}

// Legacy Alias
type ValidationReport = UniversalResponse;

interface ValidationRules {
  application_type: string;
  required_fields: string[];
  required_documents: string[];
  critical_fields: string[];
  fuzzy_match_fields: string[];
  array_proof_mappings: Record<string, string>;
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

    // Remove Content-Type for FormData (let browser set it with boundary)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
      try {
        await this.refresh();
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new Error(error.detail || `API Error: ${retryResponse.status}`);
        }
        return retryResponse.json();
      } catch (e) {
        this.clearAuth();
        throw e;
      }
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



  // Validation endpoints
  async validateForm(applicationType: string, files: File[]): Promise<UniversalResponse> {
    const formData = new FormData();
    formData.append('application_type', applicationType);
    files.forEach((file) => formData.append('files', file));

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/validate-form`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Validation failed: ${response.status}`);
    }

    return response.json();
  }

  async getValidationRules(applicationType: string): Promise<ValidationRules> {
    return this.request<ValidationRules>(`/validate-form/rules/${encodeURIComponent(applicationType)}`);
  }

  async getSupportedValidationTypes(): Promise<{ supported_types: string[]; count: number }> {
    return this.request<{ supported_types: string[]; count: number }>('/validate-form/supported-types');
  }

  async submitFeedback(sessionId: string, field: string, type: 'upvote' | 'downvote', text?: string): Promise<void> {
    return this.request<void>(`/v1/validation-sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ field, type, text }),
    });
  }
}

export const api = new ApiClient();
export type { SessionDetail, BoundingBox, ValidationReport, UniversalResponse, FieldEntity, ValidationIssue, ValidationRules };
