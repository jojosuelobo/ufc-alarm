export class CitoApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CitoApiError";
  }
}
