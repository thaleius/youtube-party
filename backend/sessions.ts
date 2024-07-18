import { getUserPlayerInstances, play } from "backend/integrations/discord/Client.ts";
import { SessionT, Session, User, UserT } from "common/components/integrations/discord/Definitions.ts";
import { sorter } from "common/sort.tsx";

export type Item = {
  title: string;
  thumbnail: string;
  duration: string;
  id: string;
  likes: Set<string>;
  liked?: boolean;
  added: number;
};

export type code = string;
// map of session codes to session data
export const sessions = await lazyEternalVar('sessions') ?? $$(new Map<code, SessionT>());

export const getSessionWithCode = (code: string) => {
  return sessions.get(code);
}

export const getAndRemoveNextVideoFromSession = (code: string) => {
  const session = getSessionWithCode(code);
  if (!session) {
    return;
  }
  const video = session.queue.toSorted(sorter).at(0);
  if (video) {
    session.queue.splice(session.queue.indexOf(video), 1);
    session.currentlyPlaying = video;
    const playerInstances = getUserPlayerInstances(session.host.id);
    if (playerInstances)
      play(
        playerInstances,
        {
          track: video.id,
        },
        () => getAndRemoveNextVideoFromSession(code)
      );
      session.host.discord.playing = true;
      session.host.discord.active = true;
  } else {
    session.host.discord.active = false;
    session.host.discord.playing = false;
    session.currentlyPlaying = null;
  }
  return video;
}

export const getSession = () => {
  const user = getUser();

  for (const [_code, session] of sessions) {
    if (session.host.id === user.id) {
      return session;
    }
  }

  // create new
  const session = new Session(user);
  sessions.set(session.code, session);

  return session;
}


export const updateUser = (code: string) => {
  const client = getUser();
  const session = getSessionWithCode(code);
  if (!session) {
    return;
  }
  session.clients.set(client.id, client);
  
  return session;
}

export const addClientsInfo = (code: string, nick: string) => {
  const client = getUser();
  const session = getSessionWithCode(code);
  if (!session) {
    return;
  }

  client.name = nick;

  return session;
}

export const toggleLike = (code: string, videoId: string) => {
  try {
    const user = getUser();

    const session = getSessionWithCode(code);;
    if (!session) {
      return;
    }
    const video = session.queue.find((video) => video.id == videoId);
    if (!video) {
      return;
    }
    if (video.likes.has(user.id)) {
      video.likes.delete(user.id);
    } else {
      video.likes.add(user.id);
    }

    return video;
  } catch (error) {
    console.error(error);
  }
}

const users = await lazyEternalVar("users") ?? $$(new Map<string, UserT>())

/**
 * Returns an existing or a newly created user session.
 * 
 * @param endpoint - The endpoint must be passed as a parameter if the function is called from the backend
 * @returns A new or existing user session
 */
export const getUser = (endpoint?: string) => {
  const e = endpoint ? endpoint : datex.meta.caller.main.toString();
  if (!users.has(e)) {
    users.set(e, new User(e));
  }
  return users.get(e)!;
}

export const getSortedQueue = (code: string) => {
  const session = getSessionWithCode(code);
  if (!session) {
    console.log("no session!")
    return $$([])
  }
  return always(() => {
    return session.queue.toSorted(sorter);
  });
}

export const addItemToQueue = (code: string, item: Item) => {
  const session = getSessionWithCode(code);
  if (!session) {
    return;
  }
  session.queue.push(item);

  if (!session.currentlyPlaying) {
    if (getUserPlayerInstances(session.host.id).length > 0) {
      session.host.discord.playing = true;
      session.host.discord.active = true;
      getAndRemoveNextVideoFromSession(code);
    }
  }

  return session;
}

export const getRecommendedQueue = (code: string) => {
  const session = getSessionWithCode(code);
  if (!session) {
    console.log("no session!")
    return $$([])
  }
  return always(() => {
    return session.recommendedQueue
  });
}