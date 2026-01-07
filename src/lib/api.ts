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
  source_documents?: Array<{ filename: string; document_title: string; page_numbers: number[]; url?: string }>;
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

interface SessionListItem {
  session_id: string;
  application_type: string;
  created_at: string;
  file_count: number;
  session_type: 'extraction' | 'validation';
  confidence_score?: number;
  error_count?: number;
  warning_count?: number;
}

interface SessionListResponse {
  items: SessionListItem[];
  total_count: number;
  limit: number;
  offset: number;
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

  async listSessions(limit: number = 50, offset: number = 0): Promise<SessionListResponse> {
    return this.request<SessionListResponse>(`/v1/me/sessions?limit=${limit}&offset=${offset}`);
  }


  async getSession(sessionId: string): Promise<SessionDetail> {
    const response = await this.request<any>(`/v1/validation-sessions/${sessionId}`);

    // The backend returns a wrapped object with validation_report
    // We need to treat the validation_report as the "UniversalResponse" 
    // but ensure metadata includes the top-level fields we might need.
    const report = response.validation_report;

    // Ensure metadata has what we need
    if (!report.metadata) report.metadata = {};
    report.metadata.validation_id = response.validation_id;
    report.metadata.extraction_session_id = response.extraction_session_id;

    // We also need to attach the documents/source_documents if they aren't in the report
    // The backend response might need to be checked for where docs are stored.
    // Looking at validation_sessions.py, it returns:
    // "extraction_summary": session.extraction_summary_json
    // The documents might be in extraction_summary. 

    // Let's assume for now the validation_report contains most things, 
    // but we might need to patch in documents if they are missing.
    // For now, let's use the transformed logic.

    return transformToSessionDetail(report, response.application_type);
  }

  // Validation Configuration Management
  async getValidationConfigs(): Promise<{ configs: any[] }> {
    return this.request<{ configs: any[] }>('/v1/validation-configs');
  }

  async getValidationConfig(applicationType: string): Promise<any> {
    return this.request<any>(`/v1/validation-configs/${encodeURIComponent(applicationType)}`);
  }

  async createValidationConfig(config: any): Promise<any> {
    return this.request<any>('/v1/validation-configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateValidationConfig(applicationType: string, config: any): Promise<any> {
    return this.request<any>(`/v1/validation-configs/${encodeURIComponent(applicationType)}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteValidationConfig(applicationType: string): Promise<void> {
    return this.request<void>(`/v1/validation-configs/${encodeURIComponent(applicationType)}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

export function transformToSessionDetail(report: UniversalResponse, applicationType: string): SessionDetail {
  // ADAPTER: Transform UniversalResponse -> SessionDetail (Ui Model)
  const flatSummary: Record<string, any> = {};
  const bboxes: Record<string, any[]> = {};
  const citations: Record<string, string[]> = {};
  const remarks: Record<string, string> = {};

  // 1. Flatten Schema Projection -> Summary
  if (report.schema_projection && Array.isArray(report.schema_projection.ordered_fields)) {
    report.schema_projection.ordered_fields.forEach(item => {
      if (item.value !== null && item.value !== undefined) {
        flatSummary[item.schema_field] = item.value;
      }
      if (item.reasoning) {
        remarks[item.schema_field] = item.reasoning;
      }
    });
  } else {
    // Legacy Fallback: If no schema projection, use top-level fields (excluding known metadata)
    console.log('[DEBUG] Legacy report detected, falling back to top-level fields');
    Object.entries(report as any).forEach(([k, v]) => {
      if (!['_errors', '_token_usage', 'source_documents', 'validation_summary', 'bounding_boxes', 'citations', 'key_details'].includes(k)) {
        flatSummary[k] = v;
      }
    });
  }

  // 2. Build Bounding Boxes & Citations from Field Entities
  const entityMap = new Map((report.field_entities || []).map(e => [e.field_id, e]));

  // Pick up existing bounding boxes if they exist (Legacy Support)
  if ((report as any).bounding_boxes) {
    Object.entries((report as any).bounding_boxes).forEach(([k, v]) => {
      bboxes[k] = v as any[];
    });
  }

  // Helper to extract member identifier from field_id
  // e.g., "fe_fm_paluri_kamalavathi_aadhaar_1" -> "paluri_kamalavathi"
  const extractMemberIdentifier = (fieldId: string): string | null => {
    const match = fieldId.match(/^fe_fm_(.+?)_(?:aadhaar|dob|yob|name)_\d+$/i);
    return match ? match[1] : null;
  };

  // Helper to normalize names for comparison
  const normalizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z]/g, '');
  };

  // Helper to map field_id subfield (e.g., "aadhaar", "dob") to schema subfield
  const mapSubfield = (fieldId: string): string | null => {
    if (fieldId.includes('_aadhaar_')) return 'aadhaar';
    if (fieldId.includes('_dob_') || fieldId.includes('_yob_')) return 'age';
    if (fieldId.includes('_name_')) return 'name';
    return null;
  };

  if (report.schema_projection && Array.isArray(report.schema_projection.ordered_fields)) {
    report.schema_projection.ordered_fields.forEach(item => {
      const derivedIds = item.derived_from || [];
      const key = item.schema_field;
      const value = item.value;

      // Check if this is an array field
      const isArrayField = Array.isArray(value);

      if (isArrayField && value.length > 0) {
        console.log(`[DEBUG] Processing array field: ${key}, length: ${value.length}`);
      }

      derivedIds.forEach(fid => {
        const ent = entityMap.get(fid);
        if (!ent) return;

        let targetKey = key;

        // If this is an array field, try to match the entity to a specific array element
        if (isArrayField && value.length > 0) {
          let matchIndex = -1;
          let subfield = mapSubfield(fid);

          // 1. Try to extract identifier from common patterns
          let identifier = extractMemberIdentifier(fid);

          // 2. If no identifier, check if the fid itself contains a member's name
          if (!identifier) {
            matchIndex = value.findIndex((member: any) => {
              if (!member.name) return false;
              const normName = normalizeName(member.name);
              const normFid = fid.toLowerCase();
              return normFid.includes(normName) && normName.length > 3;
            });
          } else {
            // 3. Match identifier to member name
            const normId = normalizeName(identifier);
            matchIndex = value.findIndex((member: any) => {
              if (!member.name) return false;
              const normName = normalizeName(member.name);
              return normName.includes(normId) || normId.includes(normName);
            });
          }

          // 4. Try to determine subfield more broadly if not already found
          if (!subfield) {
            const fidLower = fid.toLowerCase();
            if (fidLower.includes('aadhaar')) subfield = 'aadhaar';
            else if (fidLower.includes('dob') || fidLower.includes('age') || fidLower.includes('yob')) subfield = 'age';
            else if (fidLower.includes('gender') || fidLower.includes('sex')) subfield = 'gender';
            else if (fidLower.includes('relat')) subfield = 'relationship';
            else if (fidLower.includes('name')) subfield = 'name';
          }

          if (matchIndex !== -1 && subfield) {
            targetKey = `${key}[${matchIndex}].${subfield}`;
            console.log(`[DEBUG] Matched ${fid} -> ${targetKey}`);
          } else if (matchIndex !== -1) {
            // If we matched the person but not the specific field, 
            // we can still attach it to the person object or let it stay at array level
            // Stay at array level for now or try to guess? 
            // Let's stick with specific fields for now.
          }
        }

        // Bounding Boxes
        if (ent.citation?.bounding_box && Array.isArray(ent.citation.bounding_box)) {
          if (!bboxes[targetKey]) bboxes[targetKey] = [];

          ent.citation.bounding_box.forEach((box: any) => {
            bboxes[targetKey].push({
              filename: ent.document.filename,
              page: ent.document.page,
              coordinates: box,
              document_title: ent.document.document_type
            });
          });
        }

        // Citations (Text)
        if (ent.citation?.text_snippet) {
          if (!citations[targetKey]) citations[targetKey] = [];
          const snippet = `${ent.document.filename} (Page ${ent.document.page}) - ${ent.citation.text_snippet}`;
          if (!citations[targetKey].includes(snippet)) {
            citations[targetKey].push(snippet);
          }
        }
      });
    });
  }

  // 3. Capture Unmapped Entites with Bounding Boxes (Supplementary Data)
  const unmappedSummary: Record<string, any> = {};
  const unmappedFields = (report as any).schema_projection?.unmapped_fields || [];

  unmappedFields.forEach((ent: any) => {
    const resolvedEnt = entityMap.get(ent.field_id) || ent;

    if (resolvedEnt.citation?.bounding_box && Array.isArray(resolvedEnt.citation.bounding_box) && resolvedEnt.citation.bounding_box.length > 0) {
      const key = `ext_${resolvedEnt.field_name}`;
      unmappedSummary[key] = resolvedEnt.field_value;

      if (!bboxes[key]) bboxes[key] = [];
      resolvedEnt.citation.bounding_box.forEach((box: any) => {
        bboxes[key].push({
          filename: resolvedEnt.document.filename,
          page: resolvedEnt.document.page,
          coordinates: box,
          document_title: resolvedEnt.document.document_type
        });
      });

      if (resolvedEnt.citation?.text_snippet) {
        if (!citations[key]) citations[key] = [];
        const snippet = `${resolvedEnt.document.filename} (Page ${resolvedEnt.document.page}) - ${resolvedEnt.citation.text_snippet}`;
        if (!citations[key].includes(snippet)) {
          citations[key].push(snippet);
        }
      }
    }
  });

  // 3. Map Issues
  const mappedIssues = (report.issues || []).map(i => ({
    ...i,
    field: i.schema_field // Map schema_field to field for UI
  }));

  // 4. Build flat page_text for backward compatibility
  const flatPageText: Record<string, string> = {};

  const extractionSessionId = report.metadata?.extraction_session_id;

  const documentsWithUrls = (report.documents || []).map(doc => {
    // Create flat page text map
    doc.pages?.forEach((p: any) => {
      flatPageText[`${doc.filename}_page_${p.page_number}`] = p.text;
      if ((report.documents || []).length === 1) {
        flatPageText[`page_${p.page_number}`] = p.text;
      }
    });

    // Add URL if missing and we have a session ID
    return {
      ...doc,
      url: (doc.url || (extractionSessionId
        ? `${API_BASE_URL}/v1/me/sessions/${extractionSessionId}/documents/${doc.filename}`
        : ''))
    };
  });

  console.log('[DEBUG] Final bounding boxes keys:', Object.keys(bboxes));
  console.log('[DEBUG] Bounding boxes:', bboxes);

  return {
    session_id: report.metadata?.validation_id || report.metadata?.extraction_session_id || `temp-${Date.now()}`,
    application_type: applicationType,
    created_at: new Date().toISOString(),
    file_count: documentsWithUrls.length,
    summary: flatSummary,
    unmapped_summary: unmappedSummary,
    bounding_boxes: bboxes,
    citations: citations,
    documents: [], // kept for type compatibility if needed, but source_documents is preferred
    source_documents: documentsWithUrls,
    issues: mappedIssues,
    validation_summary: `Confidence: ${Math.round((report.validation_summary?.confidence_score || 0) * 100)}%`,
    page_text: flatPageText,
    field_remarks: remarks,
    errors: []
  };
}
export type { SessionDetail, BoundingBox, ValidationReport, UniversalResponse, FieldEntity, ValidationIssue, ValidationRules, SessionListItem, SessionListResponse };

