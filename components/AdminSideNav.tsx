"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";

interface AdminSideNavProps {
	onNavigate?: (href: string) => boolean | void;
}

export default function AdminSideNav({ onNavigate }: AdminSideNavProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	const navItems = [
		{ name: "Bookings", href: "/admin/view-booking", icon: "📋" },
		{ name: "Manage Floor Plans", href: "/admin/manage-floor-plan", icon: "🗺️" },
	];

	return (
		<aside
			className={`fixed left-0 top-0 h-screen bg-white shadow-lg transition-all duration-300 z-50 ${
				isCollapsed ? "w-16" : "w-48"
			}`}
			data-testid="admin-side-nav"
		>
			<div className="flex flex-col h-full">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					{!isCollapsed && <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="p-2 rounded-md hover:bg-gray-100 transition-colors"
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						data-testid="sidebar-toggle"
					>
						<span className="text-xl">{isCollapsed ? "→" : "←"}</span>
					</button>
				</div>

				{/* Navigation Items */}
				<nav className="flex-1 overflow-y-auto py-4">
					<ul className="space-y-2 px-2">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							
							const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
								if (onNavigate) {
									e.preventDefault();
									const shouldNavigate = onNavigate(item.href);
									if (shouldNavigate !== false) {
										router.push(item.href);
									}
								}
							};
							
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										onClick={handleClick}
										className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
											isActive
												? "bg-blue-500 text-white"
												: "text-gray-700 hover:bg-gray-100"
										}`}
										title={isCollapsed ? item.name : undefined}
										data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
									>
										<span className="text-xl">{item.icon}</span>
										{!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Logout Button */}
				<div className="p-4 border-t border-gray-200">
					{isCollapsed ? (
						<button
							onClick={() => {
								const logoutBtn = document.querySelector('[data-logout-trigger]');
								if (logoutBtn instanceof HTMLElement) {
									logoutBtn.click();
								}
							}}
							className="w-full p-2 bg-red-500 text-white text-xl rounded-md hover:bg-red-600 transition-colors"
							title="Logout"
						>
							🚪
						</button>
					) : (
						<LogoutButton />
					)}
				</div>
			</div>
		</aside>
	);
}
