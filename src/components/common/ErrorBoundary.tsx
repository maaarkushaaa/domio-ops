import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg border bg-red-50 text-red-700">
          <div className="font-semibold mb-1">Произошла ошибка</div>
          <div className="text-sm">Попробуйте обновить страницу или вернуться позже.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
