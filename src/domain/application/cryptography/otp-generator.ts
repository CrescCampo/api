export default abstract class OtpGenerator {
  abstract generate(): Promise<{ plain: string; hash: string }>;

  abstract hash(plain: string): string;
}
