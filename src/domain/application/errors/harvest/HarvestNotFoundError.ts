export default class HarvestNotFoundError extends Error {
  constructor() {
    super('Harvest not found');
    this.name = 'HarvestNotFoundError';
  }
}
