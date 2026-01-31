# Authentication System Documentation

## Overview

A comprehensive authentication system has been implemented with middleware-based route protection and dual storage (localStorage + cookies) for secure token management.

## Architecture

### 1. Middleware (`middleware.ts`)
- **Purpose**: Server-side route protection before pages load
- **Features**:
  - Automatically redirects unauthenticated users to login
  - Routes admin users to `/admin/login`
  - Routes public users to `/public/login`
  - Prevents logged-in users from accessing login pages
  - Preserves redirect URL for post-login navigation

### 2. Auth Utilities (`utils/auth.ts`)
- **Purpose**: Centralized authentication management
- **Functions**:
  - `setAuthData(token, role, userData)` - Stores auth data in both localStorage and cookies
  - `getAuthToken()` - Retrieves current auth token
  - `getUserRole()` - Returns 'admin' | 'user' | null
  - `getUserData()` - Gets stored user information
  - `clearAuthData()` - Clears all auth data (logout)
  - `isAuthenticated()` - Quick auth check
  - `isAdmin()` - Check if current user is admin
  - `isUser()` - Check if current user is regular user

### 3. Login Pages
- **Admin Login**: `/app/admin/login/page.tsx`
- **Public Login**: `/app/public/login/page.tsx`
- Both use `setAuthData()` to store credentials in localStorage AND cookies

## Why Dual Storage?

### localStorage
- ✅ Accessible in client components
- ✅ Used by API calls (OpenAPI.TOKEN)
- ✅ Can store larger data (user info)
- ❌ Not accessible in middleware

### Cookies
- ✅ Accessible in middleware (server-side)
- ✅ Can be HttpOnly for better security
- ✅ Automatic expiration (7 days)
- ❌ Size limitations (4KB)

## Protected Routes

### Admin Routes
All routes under `/admin/*` (except `/admin/login`) require:
- Valid `authToken` in cookies
- `userRole` = 'admin'

**Examples**:
- `/admin/manage-floor-plan` ✅
- `/admin/view-booking` ✅
- `/admin/manage-seat` ✅

### Public User Routes
All routes under `/public/*` (except `/public/login`) require:
- Valid `authToken` in cookies
- `userRole` = 'user'

**Examples**:
- `/public/dashboard` ✅
- `/public/book-seat` ✅

## Flow Diagrams

### Login Flow
```
User visits /admin/some-page (not logged in)
    ↓
Middleware detects no token
    ↓
Redirects to /admin/login?redirect=/admin/some-page
    ↓
User enters credentials
    ↓
API authenticates → returns token
    ↓
setAuthData() stores token in:
  - localStorage (for API calls)
  - Cookies (for middleware)
    ↓
Router pushes to redirect URL or default page
    ↓
Middleware sees valid token + role → allows access
```

### Logout Flow
```
User clicks Logout button
    ↓
clearAuthData() removes:
  - localStorage items
  - Cookie values
    ↓
Router pushes to /admin/login or /public/login
    ↓
Middleware prevents access to protected routes
```

## Usage Examples

### In Client Components (API Calls)

```typescript
import { getAuthToken } from '@/utils/auth';
import { OpenAPI, SomeService } from '@/src/api';

// Before making API calls
const token = getAuthToken();
if (token) {
  OpenAPI.TOKEN = token;
}

// Then make your API call
const response = await SomeService.getData();
```

### In Login Pages

```typescript
import { setAuthData } from '@/utils/auth';

// After successful login
const response = await AuthenticationService.postApiAuthAdminLogin({
  email,
  password,
});

if (response.data?.token) {
  // This stores in BOTH localStorage and cookies
  setAuthData(response.data.token, 'admin', response.data.admin);
  
  // Set for immediate API calls
  OpenAPI.TOKEN = response.data.token;
  
  // Navigate to protected route
  router.push('/admin/view-booking');
}
```

### Adding Logout Button

```typescript
import LogoutButton from '@/components/LogoutButton';

export default function SomePage() {
  return (
    <div>
      <LogoutButton className="ml-auto" />
      {/* Rest of your page */}
    </div>
  );
}
```

## Security Features

1. **Cookie Security**:
   - `SameSite=Strict` prevents CSRF attacks
   - 7-day expiration (604800 seconds)
   - Path restricted to `/`

2. **Role-Based Access**:
   - Middleware validates both token AND role
   - Prevents role escalation (user accessing admin routes)

3. **Redirect Preservation**:
   - After login, users return to intended page
   - Prevents lost navigation context

4. **Token Expiration**:
   - Cookies auto-expire after 7 days
   - Users must re-authenticate

## Files Modified/Created

### Created:
- ✅ `middleware.ts` - Route protection
- ✅ `utils/auth.ts` - Auth utilities
- ✅ `components/LogoutButton.tsx` - Logout component

### Modified:
- ✅ `app/admin/login/page.tsx` - Uses `setAuthData()`
- ✅ `app/public/login/page.tsx` - Uses `setAuthData()` + real API
- ✅ `app/admin/manage-floor-plan/page.tsx` - Uses `getAuthToken()`
- ✅ `app/admin/manage-floor-plan/[id]/page.tsx` - Uses `getAuthToken()`

## Testing Checklist

### Unauthenticated Access
- [ ] Visit `/admin/manage-floor-plan` → redirects to `/admin/login`
- [ ] Visit `/admin/view-booking` → redirects to `/admin/login`
- [ ] Visit `/public/dashboard` → redirects to `/public/login`

### Admin Login
- [ ] Login at `/admin/login` with admin credentials
- [ ] Verify redirects to `/admin/view-booking` (or redirect param)
- [ ] Verify can access `/admin/manage-floor-plan`
- [ ] Verify cannot access `/public/dashboard` (wrong role)

### Public User Login
- [ ] Login at `/public/login` with user credentials
- [ ] Verify redirects to `/public/dashboard`
- [ ] Verify cannot access `/admin/*` routes

### Logout
- [ ] Click logout button
- [ ] Verify redirects to appropriate login page
- [ ] Verify cannot access protected routes
- [ ] Verify localStorage is cleared
- [ ] Verify cookies are cleared

### Redirect Preservation
- [ ] Visit `/admin/manage-floor-plan` without auth
- [ ] Note redirect param in URL: `/admin/login?redirect=/admin/manage-floor-plan`
- [ ] Login successfully
- [ ] Verify returns to `/admin/manage-floor-plan`

## Common Issues & Solutions

### Issue: Still being redirected after login
**Solution**: Check that cookies are being set properly. Open DevTools → Application → Cookies and verify `authToken` and `userRole` exist.

### Issue: API calls return 401 Unauthorized
**Solution**: Ensure `OpenAPI.TOKEN` is set before API calls:
```typescript
const token = getAuthToken();
if (token) OpenAPI.TOKEN = token;
```

### Issue: Middleware not running
**Solution**: Check middleware matcher config. Make sure your route isn't excluded.

### Issue: Infinite redirect loop
**Solution**: Verify login pages are excluded from middleware protection (they are by default).

## Environment Variables

Make sure these are set in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Future Enhancements

1. **Token Refresh**: Implement automatic token renewal
2. **Remember Me**: Extend cookie expiration for "remember me" option
3. **Session Timeout**: Add idle timeout with warning modal
4. **Multi-device Logout**: Invalidate all sessions from backend
5. **2FA Support**: Add two-factor authentication flow
6. **HttpOnly Cookies**: Move to server-side cookie setting for better security

---

✅ **Authentication system is fully implemented and ready to use!**
