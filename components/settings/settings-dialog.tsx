"use client";

import { Eye, EyeOff, Puzzle, Settings, User } from "lucide-react";
import * as React from "react";
import { generateApiToken, getApiToken } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const sidebarItems = [
	{ name: "Account", icon: User, id: "account" },
	{ name: "General", icon: Settings, id: "general" },
	{ name: "Integrations", icon: Puzzle, id: "integrations" },
];

export function SettingsDialog({
	open,
	onOpenChange,
	trigger,
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}) {
	const [activeTab, setActiveTab] = React.useState("general");
	const { data: session } = authClient.useSession();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-5xl p-0 overflow-hidden h-[80vh] flex gap-0">
				<DialogTitle className="sr-only">Settings</DialogTitle>

				{/* Sidebar */}
				<div className="w-64 bg-muted/30 border-r flex flex-col">
					<div className="p-4 font-semibold text-lg">Settings</div>
					<div className="px-2 space-y-1">
						{sidebarItems.map((item) => (
							<Button
								key={item.id}
								variant="ghost"
								className={cn(
									"w-full justify-start gap-2",
									activeTab === item.id && "bg-muted",
								)}
								onClick={() => setActiveTab(item.id)}
							>
								<item.icon className="h-4 w-4" />
								{item.name}
							</Button>
						))}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{activeTab === "general" && <SettingsGeneral />}
					{activeTab === "account" && <SettingsAccount user={session?.user} />}
					{activeTab === "integrations" && <SettingsIntegrations />}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SettingsAccount({
	user,
}: {
	user?: { name: string; email: string; image?: string | null; id: string };
}) {
	if (!user) return <div className="p-4">Loading user information...</div>;

	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h2 className="text-lg font-medium mb-4">Account</h2>

				<div className="flex items-center gap-4 mb-8">
					<Avatar className="h-20 w-20">
						<AvatarImage src={user.image || ""} alt={user.name} />
						<AvatarFallback className="text-2xl">
							{user.name.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div>
						<h3 className="text-xl font-semibold">{user.name}</h3>
						<p className="text-muted-foreground">{user.email}</p>
					</div>
				</div>

				<div className="space-y-4">
					<div className="grid gap-2">
						<Label>Name</Label>
						<div className="p-2 border rounded-md bg-muted/50 text-sm">
							{user.name}
						</div>
					</div>

					<div className="grid gap-2">
						<Label>Email</Label>
						<div className="p-2 border rounded-md bg-muted/50 text-sm">
							{user.email}
						</div>
					</div>

					<div className="grid gap-2">
						<Label>User ID</Label>
						<div className="p-2 border rounded-md bg-muted/50 text-xs font-mono text-muted-foreground">
							{user.id}
						</div>
					</div>
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-medium mb-4 text-destructive">
					Danger Zone
				</h3>
				<Button variant="destructive">Delete Account</Button>
			</div>
		</div>
	);
}

function SettingsIntegrations() {
	const [token, setToken] = React.useState<string | null>(null);
	const [isVisible, setIsVisible] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		getApiToken().then(setToken);
	}, []);

	const handleGenerate = async () => {
		setLoading(true);
		try {
			const newToken = await generateApiToken();
			setToken(newToken);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = () => {
		if (token) navigator.clipboard.writeText(token);
	};

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h2 className="text-lg font-medium mb-4">API token</h2>
				<div className="text-sm text-muted-foreground mb-4">
					Your API token provides full access to view and modify your Focus
					data. Please treat this like a password and take care when sharing it.
				</div>

				<div className="flex gap-2 mb-4">
					<div className="relative flex-1">
						<input
							type={isVisible ? "text" : "password"}
							value={token || ""}
							readOnly
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 font-mono"
							placeholder="No token generated"
						/>
						<button
							type="button"
							onClick={() => setIsVisible(!isVisible)}
							className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
						>
							{isVisible ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				<div className="flex gap-4">
					<Button
						variant="secondary"
						onClick={copyToClipboard}
						disabled={!token}
					>
						Copy API token
					</Button>
					<Button
						variant="outline"
						onClick={handleGenerate}
						disabled={loading}
						className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"
					>
						{token ? "Issue a new API token" : "Generate API token"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function SettingsGeneral() {
	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h2 className="text-lg font-medium mb-4">General</h2>

				<div className="space-y-4">
					<div className="grid gap-2">
						<Label>Language</Label>
						<Select defaultValue="en">
							<SelectTrigger>
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="en">English</SelectItem>
								<SelectItem value="es">Spanish</SelectItem>
								<SelectItem value="fr">French</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label>Home view</Label>
						<Select defaultValue="today">
							<SelectTrigger>
								<SelectValue placeholder="Select home view" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="today">Today</SelectItem>
								<SelectItem value="inbox">Inbox</SelectItem>
								<SelectItem value="upcoming">Upcoming</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-medium mb-4">Date & time</h3>
				<div className="space-y-4">
					<div className="grid gap-2">
						<Label>Time zone</Label>
						<Select defaultValue="asia/bangkok">
							<SelectTrigger>
								<SelectValue placeholder="Select time zone" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="asia/bangkok">Asia/Bangkok</SelectItem>
								<SelectItem value="utc">UTC</SelectItem>
								<SelectItem value="america/new_york">
									America/New York
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label>Time format</Label>
						<Select defaultValue="24">
							<SelectTrigger>
								<SelectValue placeholder="Select time format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="24">13:00</SelectItem>
								<SelectItem value="12">1:00 PM</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label>Date format</Label>
						<Select defaultValue="dd-mm-yyyy">
							<SelectTrigger>
								<SelectValue placeholder="Select date format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
								<SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
								<SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label>Week start</Label>
						<Select defaultValue="monday">
							<SelectTrigger>
								<SelectValue placeholder="Select week start" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="monday">Monday</SelectItem>
								<SelectItem value="sunday">Sunday</SelectItem>
								<SelectItem value="saturday">Saturday</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-[0.8rem] text-muted-foreground">
							Begin your week on this day in Upcoming and calendar views.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
