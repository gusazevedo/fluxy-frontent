export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
