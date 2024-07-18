import { UserT } from "common/components/integrations/discord/Definitions.ts";

export default function UserDisplay({ clients }: Readonly<{ clients: Map<string, UserT> }>) {
	const userDisplay = always(() => {
		const names = Array.from(clients.values()).map(client => client.name).filter(name => name?.toLowerCase());
		// Filter out any names that are "anon" before rendering
		if (names.length === 0) {
			return <></>;
		} else {
			return (
				<div class="w-full flex justify-center mt-4">
					<div class="flex flex-wrap justify-start items-center gap-4">
						{names.map((name) => (
							<div class="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
								{name}
							</div>
						))}
					</div>
				</div>
			)
		}
	});
  
	return (
	  <>
			{userDisplay}
		</>
	);
}