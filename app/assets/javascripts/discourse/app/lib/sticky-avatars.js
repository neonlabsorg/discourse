import Site from "discourse/models/site";
import { bind } from "discourse-common/utils/decorators";
import { schedule } from "@ember/runloop";
import { addWidgetCleanCallback } from "discourse/components/mount-widget";

export default class StickyAvatars {
  stickyClass = "sticky-avatar";
  topicPostSelector = "#topic .post-stream .topic-post";
  intersectionObserver = null;
  direction = "⬇️";
  prevOffset = -1;

  constructor(container) {
    this._container = container;
    this.appEvents = container.lookup("service:app-events");
  }

  init() {
    if (Site.currentProp("mobileView")) {
      return;
    }

    this.appEvents.on("topic:current-post-scrolled", this._handlePostNodes);
    this.appEvents.on("topic:scrolled", this._handleScroll);
    this.appEvents.on("page:topic-loaded", this._initIntersectionObserver);
    addWidgetCleanCallback("post-stream", this._clearIntersectionObserver);
  }

  @bind
  _handleScroll(offset) {
    if (offset >= this.prevOffset) {
      this.direction = "⬇️";
    } else {
      this.direction = "⬆️";
    }
    this.prevOffset = offset;

    if (offset <= 0) {
      this.direction = "⬇️";

      document
        .querySelectorAll(`${this.topicPostSelector}.${this.stickyClass}`)
        .forEach((node) => node.classList.remove(this.stickyClass));
    }
  }

  _applyMarginOnOp(op) {
    const topicAvatarNode = op.querySelector(".topic-avatar");

    if (!topicAvatarNode) {
      return;
    }

    if (op.querySelector("#post_1")) {
      const topicMapNode = op.querySelector(".topic-map");
      if (topicMapNode) {
        topicAvatarNode.style.marginBottom = `${topicMapNode.clientHeight}px`;
        return;
      }
    }

    topicAvatarNode.style.marginBottom = null;
  }

  @bind
  _handlePostNodes() {
    this._clearIntersectionObserver();

    schedule("afterRender", () => {
      this._initIntersectionObserver();

      document.querySelectorAll(this.topicPostSelector).forEach((postNode) => {
        this._applyMarginOnOp(postNode);
        this.intersectionObserver.observe(postNode);
      });
    });
  }

  @bind
  _initIntersectionObserver() {
    const headerHeight = document.querySelector(".d-header")?.clientHeight || 0;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio === 1) {
            entry.target.classList.remove(this.stickyClass);
            return;
          }

          const postContentHeight = entry.target.querySelector(".contents")
            ?.clientHeight;
          if (
            this.direction === "⬆️" ||
            postContentHeight > window.innerHeight - headerHeight
          ) {
            entry.target.classList.add(this.stickyClass);
          }
        });
      },
      { threshold: [0.0, 1.0], rootMargin: `-${headerHeight}px 0px 0px 0px` }
    );
  }

  @bind
  _clearIntersectionObserver() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
  }
}
