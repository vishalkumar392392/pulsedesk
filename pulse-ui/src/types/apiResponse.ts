interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Response {
  success: boolean;
  statusCode: number;
  message: string;
  data: AuthTokens;
}
