import { Buffer } from "buffer";

type GlobalScope = typeof globalThis & {
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
};

const globalScope = globalThis as GlobalScope;

// Ensure Buffer is available in the browser for libs that expect Node globals.
if (!globalScope.Buffer) {
  globalScope.Buffer = Buffer;
}

// Some libs expect global to exist (Node-style). Map it to globalThis.
if (!globalScope.global) {
  globalScope.global = globalScope;
}
