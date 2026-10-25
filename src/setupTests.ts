import { TextEncoder, TextDecoder } from 'node:util';
Object.assign(globalThis, { TextEncoder, TextDecoder });
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();
