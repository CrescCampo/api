import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import config from 'infra/config';

@Injectable()
export default class S3Service {
  private readonly client: S3Client;

  private readonly bucket: string;

  constructor() {
    this.bucket = config.aws.s3Bucket;
    this.client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`S3 object ${key} has no body`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
