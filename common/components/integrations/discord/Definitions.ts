import { GuildData } from "backend/integrations/discord/Client.ts";
import { ObjectRef, datexClassType } from "datex-core-legacy/datex_all.ts";
import { Item, getSessionWithCode, sessions } from "backend/sessions.ts";

export const Discord = struct("Discord",
  class {
    @property isLoggedIn: boolean = false;
    @property bearer?: string;
    @property guilds?: GuildData[];
    @property playing: boolean = false;
    @property active: boolean = false;

    @property setBearer = (bearer: string) => {
      this.bearer = bearer;
    }

    construct() {
      console.log("Created Discord Object");
    }
  }
);
export type DiscordT = datexClassType<ObjectRef<typeof Discord>>;

export const User = struct("User",
  class {
    @property id!: string;
    @property name?: string;
    @property discord!: datexClassType<ObjectRef<typeof Discord>>;

    construct(endpoint: string) {
      this.id = endpoint;
      console.log("Created User Object for", endpoint);
      this.discord = new Discord();
    }
  }
);
export type UserT = datexClassType<ObjectRef<typeof User>>;

export const Session = struct("Session",
  class {
    @property code!: string;
    @property host!: UserT;
    @property clients: Map<string, UserT> = new Map();
    @property queue: Item[] = [];
    @property recommendedQueue: Item[] = [];
    @property currentlyPlaying: Item | null = null;

    construct(host: UserT) {
      // create random code that is not already in use
      let code = null;

      // check if the code is already in use
      while (!code || getSessionWithCode(code)) {
        // generate a random 4 character code consisting of uppercase letters and numbers
        code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 36).toString(36).toUpperCase()).join('');
      }
      this.code = code;
      this.host = host;

      console.log("Created Session Object for", host.id);
    }
  }
);
export type SessionT = datexClassType<ObjectRef<typeof Session>>;