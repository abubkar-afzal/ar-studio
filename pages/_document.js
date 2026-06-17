// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html data-theme="light" style={{ backgroundColor: '#ffffff' }}>
      <Head />
      <body style={{ backgroundColor: '#ffffff', margin: 0, minHeight: '100vh' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}