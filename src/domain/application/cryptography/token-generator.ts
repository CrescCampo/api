export default abstract class TokenGenerator {
  abstract generate(): Promise<{ plain: string; hash: string }>;

  abstract hash(plain: string): string;
}
