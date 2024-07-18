import { type Item } from "backend/sessions.ts";
import { SessionT } from "common/components/integrations/discord/Definitions.ts";

export const sorter = (a: Item, b: Item) => {
	if (a.likes.size > b.likes.size) return -1;
	if (a.likes.size < b.likes.size) return 1;
	if (a.added > b.added) return 1;
	if (a.added < b.added) return -1;
	return 0;
  }

export const getSortedQueue = (session: SessionT) => {
	if (!session) {
		console.log("no session!")
		return $$([])
	}
	return always(() => {
		return session.queue.toSorted(sorter);
	});
}