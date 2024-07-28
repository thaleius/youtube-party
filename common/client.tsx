import { QueueItem } from "common/components/QueueItem.tsx";
import SearchBar from "common/components/SearchBar.tsx";
import { search } from "backend/data.tsx";
import { updateUser, Item } from "backend/sessions.ts";
import NavMenu from "common/components/nav/NavMenu.tsx";
import { toggleTheme } from "common/components/ToggleThemeButton.tsx";
import { sorter } from "common/sort.tsx";
import { NowPlaying } from "common/components/NowPlaying.tsx";
import Lyrics from "common/components/lyrics/Lyrics.tsx";
import { Pointer } from "datex-core-legacy/datex_all.ts";

export default async function App(code: string) {

  //get the nick of the user from sessiondata
  //const nick = (ctx.searchParams.get('nick') ?? "anon");

  const session = await updateUser(code);

  if (!session) {
    return (
      <main class="bg-gray-50 dark:bg-gray-950">
        <div class="flex items-center justify-center h-[100vh]">
          <div class="flex flex-col items-center space-y-8">
            <h1 class="text-3xl font-bold text-black dark:text-white">Session not found</h1>
            <p class="text-gray-500 dark:text-gray-400">The session you are trying to join does not exist.</p>

            <div>
              <a href={"/welcome/" + code} class="flex w-full justify-center rounded-md bg-accent-600 dark:bg-accent-500 disabled:opacity-50 dark:hover:bg-accent-400 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">change code</a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const searchResults = $$<Item[]>([]);

  type View = "queue" | "search" | "lyrics" | "chat" | "settings";

  const views = {
    queue: $$(true),
    search: $$(false),
    lyrics: $$(false),
    chat: $$(false),
    settings: $$(false),
  } as Record<View, Pointer<boolean>>;

  const activeView = $$<View>("queue");

  const setView = (view: View) => {
    console.log("setView", view);
    activeView.val = view;
    for (const key in views) {
      views[key as View].val = key === view;
    }
  }

  const onSearch = async (value: string) => {
    setView("search");
    searchResults.splice(0, searchResults.length);
    searchResults.push(...(await search(value)));
  };

  const menu = always(() => {
    if (!activeView) return;

    console.log("activeView", activeView);

    return (
      <NavMenu
        active={activeView}
        buttons={[
          {
            label: "queue",
            onClick: () => setView("queue"),
          },
          {
            label: "search",
            onClick: () => setView("search"),
          },
          {
            label: "lyrics",
            onClick: () => setView("lyrics"),
          },
          // {
          //   label: "chat",
          //   onClick: () => setView("chat"),
          // },
          {
            label: "settings",
            onClick: () => setView("settings"),
          },
        ]}
      />
    );
  });

  const current = always(() => {
    if (session.currentlyPlaying) {
      return (
        <div class="mx-0">
          <div class="text-accent-500 font-semibold text-sm mb-2">
            currently playing
          </div>
          <NowPlaying item={session.currentlyPlaying} />
        </div>
      );
    }
    return <></>;
  });

  const sortedQueue = always(() => session.queue.toSorted(sorter).filter(item => item !== session.currentlyPlaying));

  return (
    <main class="bg-gray-50 dark:bg-gray-950">
      <div class="flex flex-col overflow-y-hidden h-[100dvh] rounded-xl mx-auto max-w-2xl">
        <div class="flex px-4 my-4 ">
          <SearchBar onSearch={onSearch} />
        </div>
        <div class="px-4 py-4 border-t border-black dark:border-white/20 mx-0 overflow-y-auto flex-grow">

          <div class="space-y-4 text-white" style={{ display: views.search }}>{
            searchResults.$.map(item => {
              return <QueueItem item={item} type={'search'} code={code}></QueueItem>
            })}
          </div>
          <div class="space-y-4 text-white" style={{ display: views.queue }}>
            {current}
            <div class={{
                "border-t": always(() => sortedQueue.length > 0),
                "py-4": true, "border-black": true, "dark:border-white/20": true, "dark:text-white": true, "mx-0": true, "overflow-y-auto": true, "flex-grow": true
              }}>
              <div class="space-y-4">
                {
                  sortedQueue.$.map(item => <QueueItem item={item} type={'client'} code={code}></QueueItem>)
                }
              </div>
            </div>
          </div>

          <div class="space-y-4 text-white" style={{ display: views.lyrics }}>
            {
              always(() => {
                if (!views.lyrics.val)
                  return <></>;
                if (!session.currentlyPlaying)
                  return <p class="text-white">There is no song playing.</p>;
                return <Lyrics video={session.currentlyPlaying} />
              })
            }
          </div>

          <div class="space-y-4 text-white" style={{ display: views.chat }}>Work in Progress
            {/*
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-medium">Chat Box</span>
              <input type="checkbox" id="darkModeToggle" class="toggle-checkbox" onclick="toggleDarkMode()"></input>
            </div>

            <div id="chatBox" class="h-64 bg-white dark:bg-gray-700 dark:text-white p-4 rounded overflow-y-auto shadow-md border border-gray-300 dark:border-gray-600">
              Messages will be displayed here
            </div>

            <div class="mt-4 flex">
              <input type="text" id="messageInput" class="flex-1 p-2 rounded-l border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Type a message..."></input>
              <button onclick="sendMessage()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r">Send</button>
            </div>
*/}
          </div>



          <div class="space-y-4 text-white" style={{ display: views.settings }}>
            <label class="inline-flex items-center cursor-pointer">
              <input onclick={toggleTheme} type="checkbox" value="" class="sr-only peer"></input>
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Dark Mode</span>
            </label>
          </div>
        </div>
      </div>
      {menu}
    </main>
  );
}
