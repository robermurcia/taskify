// Request DTOs
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface RefreshRequest {
    refreshToken: string;
}

// Response DTOs
export interface AuthResponse {
    token: string;
    refreshToken: string;
}
