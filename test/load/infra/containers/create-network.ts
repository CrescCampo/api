import { Network, StartedNetwork } from 'testcontainers';

export async function createNetwork(): Promise<StartedNetwork> {
  return new Network().start();
}
