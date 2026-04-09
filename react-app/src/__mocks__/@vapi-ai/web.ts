const mockVapi = {
  start: jest.fn().mockResolvedValue({}),
  stop: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

export default jest.fn(() => mockVapi);
