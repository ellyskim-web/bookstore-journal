import '../styles/globals.css';

export const metadata = {
  title: '서점 관찰 일지',
  description: '서점에 찾아오는 이야기를 기록합니다',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#f5f0e8" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
