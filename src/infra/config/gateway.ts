import { Injectable } from '@nestjs/common';
import ConfigGateway, {
  ConfigProps,
} from 'domain/application/gateways/config-gateway';
import config from './index';

@Injectable()
export default class InfraConfigGateway extends ConfigGateway {
  get(): ConfigProps {
    return {
      passwordResetUrl: config.resetPassword.passwordResetUrl,
      passwordResetTokenTtlInMinutes:
        config.resetPassword.passwordResetTokenTtlInMinutes,
    };
  }
}
