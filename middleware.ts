import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Get token from cookies (more secure than localStorage for middleware)
	const token = request.cookies.get('authToken')?.value;
	const userRole = request.cookies.get('userRole')?.value;

	// Define protected routes
	const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
	const isPublicProtectedRoute = pathname.startsWith('/public') && !pathname.startsWith('/public/login');
	const isPublicLoginPage = pathname === '/public/login';
	const isAdminLoginPage = pathname === '/admin/login';

	// If accessing login pages with valid token, redirect to respective dashboard
	if (token) {
		if (isAdminLoginPage && userRole === 'admin') {
			return NextResponse.redirect(new URL('/admin/view-booking', request.url));
		}
		if (isPublicLoginPage && userRole === 'user') {
			// Redirect to public dashboard or home
			return NextResponse.redirect(new URL('/public/dashboard', request.url));
		}
	}

	// Protect admin routes
	if (isAdminRoute) {
		if (!token) {
			// No token, redirect to admin login
			const loginUrl = new URL('/admin/login', request.url);
			loginUrl.searchParams.set('redirect', pathname);
			return NextResponse.redirect(loginUrl);
		}

		if (userRole !== 'admin') {
			// Has token but not admin, redirect to admin login
			return NextResponse.redirect(new URL('/admin/login', request.url));
		}
	}

	// Protect public user routes
	if (isPublicProtectedRoute) {
		if (!token) {
			// No token, redirect to public login
			const loginUrl = new URL('/public/login', request.url);
			loginUrl.searchParams.set('redirect', pathname);
			return NextResponse.redirect(loginUrl);
		}

		if (userRole !== 'user') {
			// Has token but not regular user, redirect to public login
			return NextResponse.redirect(new URL('/public/login', request.url));
		}
	}

	return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (images, etc.)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|floor-plans).*)',
	],
};
