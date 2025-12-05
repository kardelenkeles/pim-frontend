const BASE_URL = 'http://localhost:8080/api';

export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public data?: any
    ) {
        super(`API Error: ${status} ${statusText}`);
        this.name = 'ApiError';
    }
}

interface RequestOptions extends RequestInit {
    params?: Record<string, any>;
}class ApiClient {
    private baseUrl: string;
    private authToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setAuthToken(token: string | null) {
        this.authToken = token;
    }

    getAuthToken(): string | null {
        return this.authToken;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    private buildUrl(endpoint: string, params?: Record<string, any>): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach((item) => url.searchParams.append(key, String(item)));
                    } else {
                        url.searchParams.append(key, String(value));
                    }
                }
            });
        }

        return url.toString();
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');

        let data: any;
        if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new ApiError(response.status, response.statusText, data);
        }

        return data as T;
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            ...options,
            method: 'GET',
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            ...options,
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            ...options,
            method: 'PUT',
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            ...options,
            method: 'PATCH',
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            ...options,
            method: 'DELETE',
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
        });

        return this.handleResponse<T>(response);
    }
}

// Export singleton instance
export const apiClient = new ApiClient(BASE_URL);

// Export type for dependency injection if needed
export type { ApiClient };
