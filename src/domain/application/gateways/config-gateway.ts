export interface ConfigProps {
  passwordResetUrl: (token: string) => string;
  passwordResetTokenTtlInMinutes: number;
}

export default abstract class ConfigGateway {
  abstract get(): ConfigProps;
}
