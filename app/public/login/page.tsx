"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthenticationService, OpenAPI, ApiError } from "@/src/api";
import { setAuthData } from "@/utils/auth";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrors({});

		const newErrors: { email?: string; password?: string } = {};

		if (!email) {
			newErrors.email = "Email is required";
		} else if (!validateEmail(email)) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!password) {
			newErrors.password = "Password is required";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);

		try {
			// Configure API base URL
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

			// Call user login API
			const response = await AuthenticationService.postApiAuthUserLogin({
				email,
				password,
			});

			// Store token in localStorage and cookies
			if (response.data?.token) {
				setAuthData(response.data.token, 'user', response.data.user);

				// Set token for future API calls
				OpenAPI.TOKEN = response.data.token;

				console.log("User login successful:", response.data.user);
				
				// Navigate to view-booking
				router.push('/public/view-booking');
			} else {
				setErrors({ general: "Invalid response from server" });
			}
		} catch (error) {
			console.error("Login error:", error);
			
			if (error instanceof ApiError) {
				// Handle API errors
				if (error.status === 401) {
					setErrors({ general: "Invalid email or password" });
				} else if (error.body?.data?.errorMessage) {
					setErrors({ general: error.body.data.errorMessage });
				} else {
					setErrors({ general: "An error occurred. Please try again." });
				}
			} else {
				setErrors({ general: "Network error. Please check your connection." });
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900" data-testid="login-title">
						Sign In
					</h2>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit} data-testid="login-form">
					<div className="space-y-4">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								data-testid="email-input"
								className={`mt-1 block w-full px-3 py-2 border ${
									errors.email ? "border-red-500" : "border-gray-300"
								} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
								placeholder="you@example.com"
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-600" data-testid="email-error">
									{errors.email}
								</p>
							)}
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								data-testid="password-input"
								className={`mt-1 block w-full px-3 py-2 border ${
									errors.password ? "border-red-500" : "border-gray-300"
								} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
								placeholder="Enter your password"
							/>
							{errors.password && (
								<p className="mt-1 text-sm text-red-600" data-testid="password-error">
									{errors.password}
								</p>
							)}
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading}
							data-testid="submit-button"
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "Signing in..." : "Sign in"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
