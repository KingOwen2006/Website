import { mkdir, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Apps, Cards, Close, Drawer, Education, FilterBy, HeartOutline, Home, MessageOutline, Open,
  PasswordShow, Profile, Repeat, SettingsOutline, Shopping,
} from "@thatjoshguy/oneui-icons";

const directory = new URL("../public/icons/", import.meta.url);
const icons = {
  apps: Apps,
  cards: Cards,
  close: Close,
  drawer: Drawer,
  education: Education,
  filter: FilterBy,
  "feed-comments": MessageOutline,
  "feed-likes": HeartOutline,
  "feed-reposts": Repeat,
  "feed-views": PasswordShow,
  home: Home,
  open: Open,
  profile: Profile,
  shop: Shopping,
  tools: SettingsOutline,
};

await mkdir(directory, { recursive: true });
await Promise.all(Object.entries(icons).map(([name, Component]) => writeFile(
  new URL(`${name}.svg`, directory),
  renderToStaticMarkup(createElement(Component, { size: 30, color: "white", xmlns: "http://www.w3.org/2000/svg" })),
)));
