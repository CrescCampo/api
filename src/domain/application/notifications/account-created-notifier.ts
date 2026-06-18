export interface AccountCreatedNotification {
  name: string;
  email: string;
}

export default abstract class AccountCreatedNotifier {
  abstract notifyAccountCreated(
    input: AccountCreatedNotification,
  ): Promise<void>;
}
