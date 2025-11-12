// src/types/global.d.ts
declare module 'aria-query';
declare module '@babel/core';
declare module '@babel/generator';
declare module '@babel/template';
declare module '@babel/traverse';
declare module 'eslint';
declare module 'estree';
declare module 'graceful-fs';
declare module 'html-minifier-terser';
declare module 'istanbul-lib-coverage';
declare module 'istanbul-lib-report';
declare module 'istanbul-reports';
declare module 'parse-json';
declare module 'prettier';
declare module 'prop-types';
declare module 'stack-utils';
declare module '@testing-library/jest-dom';
declare module 'yargs';
declare module 'yargs-parser';

// Global types for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export {};