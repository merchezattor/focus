"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy, Plus, Puzzle, Settings, Trash2, User } from "lucide-react";
import * as React from "react";
import { createUserToken, deleteUserToken, listUserTokens } from "@/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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

interface ApiToken {
	id: string;
	name: string;
	createdAt: Date;
}

function SettingsIntegrations() {
	const [tokens, setTokens] = React.useState<ApiToken[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const [selectedToken, setSelectedToken] = React.useState<ApiToken | null>(
		null,
	);
	const [newTokenValue, setNewTokenValue] = React.useState<string | null>(null);

	const reloadTokens = React.useCallback(async () => {
		try {
			const data = await listUserTokens();
			setTokens(data);
		} catch (error) {
			console.error("Failed to fetch tokens:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		reloadTokens();
	}, [reloadTokens]);

	const handleCreate = async (name: string) => {
		try {
			const result = await createUserToken(name);
			setNewTokenValue(result.token);
			reloadTokens();
		} catch (error) {
			console.error("Failed to create token:", error);
		}
	};

	const handleDelete = async () => {
		if (!selectedToken) return;
		try {
			await deleteUserToken(selectedToken.id);
			reloadTokens();
			setDeleteDialogOpen(false);
			setSelectedToken(null);
		} catch (error) {
			console.error("Failed to delete token:", error);
		}
	};

	const copyToClipboard = (token: string) => {
		navigator.clipboard.writeText(token);
	};

	const maskToken = (token: string) => {
		return `${token.slice(0, 12)}••••••••••••`;
	};

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h2 className="text-lg font-medium mb-4">API Tokens</h2>
				<div className="text-sm text-muted-foreground mb-4">
					Your API tokens provide full access to view and modify your Focus
					data. Please treat these like passwords and take care when sharing
					them.
				</div>

				<div className="mb-4">
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Create new API token
					</Button>
				</div>

				{loading ? (
					<div className="text-sm text-muted-foreground">Loading tokens...</div>
				) : tokens.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No API tokens yet. Create one to get started.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Token</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tokens.map((token) => (
								<TableRow key={token.id}>
									<TableCell className="font-medium">{token.name}</TableCell>
									<TableCell className="font-mono text-xs">
										{maskToken("focus_placeholder_token_value")}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{formatDistanceToNow(new Date(token.createdAt), {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(token.id)}
												title="Copy token ID"
											>
												<Copy className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setSelectedToken(token);
													setDeleteDialogOpen(true);
												}}
												title="Delete token"
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<CreateTokenDialog
				open={createDialogOpen}
				onOpenChange={(open) => {
					setCreateDialogOpen(open);
					if (!open) {
						setNewTokenValue(null);
					}
				}}
				onCreate={handleCreate}
				newToken={newTokenValue}
				onCopy={(token) => copyToClipboard(token)}
			/>

			<DeleteTokenDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onDelete={handleDelete}
				tokenName={selectedToken?.name}
			/>
		</div>
	);
}

interface CreateTokenDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (name: string) => void;
	newToken: string | null;
	onCopy: (token: string) => void;
}

function CreateTokenDialog({
	open,
	onOpenChange,
	onCreate,
	newToken,
	onCopy,
}: CreateTokenDialogProps) {
	const [name, setName] = React.useState("");
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setName("");
			setError("");
		}
	}, [open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();

		if (!trimmedName) {
			setError("Name is required");
			return;
		}
		if (trimmedName.length > 50) {
			setError("Name must be 50 characters or less");
			return;
		}

		onCreate(trimmedName);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-2">
					<DialogTitle>
						{newToken ? "API Token Created" : "Create API Token"}
					</DialogTitle>
					{!newToken && (
						<DialogDescription>
							Enter a name for your API token.
						</DialogDescription>
					)}
				</DialogHeader>

				{newToken ? (
					<div className="space-y-4 pt-2">
						<div className="text-sm text-muted-foreground">
							Copy this token now. You won&apos;t be able to see it again.
						</div>
						<div className="flex gap-2">
							<Input value={newToken} readOnly className="font-mono text-xs" />
							<Button variant="secondary" onClick={() => onCopy(newToken)}>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
						<DialogFooter className="pt-4">
							<Button onClick={() => onOpenChange(false)}>Close</Button>
						</DialogFooter>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-5 pt-2">
						<div className="space-y-2">
							<Label htmlFor="token-name">Token name</Label>
							<Input
								id="token-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Production API"
								maxLength={50}
							/>
							{error && <p className="text-sm text-destructive">{error}</p>}
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Create Token</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface DeleteTokenDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: () => void;
	tokenName: string | undefined;
}

function DeleteTokenDialog({
	open,
	onOpenChange,
	onDelete,
	tokenName,
}: DeleteTokenDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete API Token</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{tokenName}&quot;? This will
						revoke access for any integrations using this token. This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onDelete}>
						Delete Token
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
