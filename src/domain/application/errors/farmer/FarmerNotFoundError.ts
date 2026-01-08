export default class FarmerNotFoundError extends Error {
  constructor() {
    super('Farmer not found');
    this.name = 'FarmerNotFoundError';
  }
}
