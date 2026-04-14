import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message = "The page you're looking for doesn't exist.";
    } else if (error.status === 403) {
      title = 'Access denied';
      message = "You don't have permission to view this page.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-100 mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-6">{message}</p>
        <Link
          to="/tickets"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Tickets
        </Link>
      </div>
    </div>
  );
}
