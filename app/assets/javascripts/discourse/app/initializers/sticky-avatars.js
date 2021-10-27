import StickyAvatars from "discourse/lib/sticky-avatars";

export default {
  name: "sticky-avatars",

  initialize(container) {
    new StickyAvatars(container).init();
  },
};
