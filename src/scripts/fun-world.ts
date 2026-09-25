type Stop = { id: string; name: string; x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

const toggle = document.querySelector<HTMLButtonElement>("#mode-toggle");
const world = document.querySelector<HTMLElement>("#fun-world");
const home = document.querySelector<HTMLElement>("#home-content");
const board = document.querySelector<HTMLElement>("#world-board");

if (toggle && world && home && board) {
  const player = world.querySelector<HTMLElement>("#world-player")!;
  const score = world.querySelector<HTMLElement>("#world-score")!;
  const hint = world.querySelector<HTMLElement>("#world-hint")!;
  const announcement = world.querySelector<HTMLElement>("#world-announcement")!;
  const welcome = world.querySelector<HTMLElement>("#world-welcome")!;
  const label = toggle.querySelector<HTMLElement>("[data-mode-label]")!;
  const landmarks = [...world.querySelectorAll<HTMLButtonElement>("[data-stop]")];
  const panels = [...world.querySelectorAll<HTMLElement>("[data-panel]")];
  const stops: Stop[] = JSON.parse(board.dataset.stops || "[]");
  const storageKey = "ishant-little-world-v1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const vectors: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const keys: Record<string, Direction> = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
  let x = 12;
  let y = 8;
  let enabled = false;
  let inputMethod = "keyboard";
  let active: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const visited = new Set<string>();

  // Remember this visit, including returning from a project. Storage is optional.
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (saved && typeof saved === "object") {
      enabled = saved.enabled === true;
      if (Number.isInteger(saved.x) && saved.x >= 1 && saved.x <= 23) x = saved.x;
      if (Number.isInteger(saved.y) && saved.y >= 1 && saved.y <= 14) y = saved.y;
      if (Array.isArray(saved.visited)) {
        for (const id of saved.visited) if (stops.some((stop) => stop.id === id)) visited.add(id);
      }
      if (visited.has(saved.active)) active = saved.active;
    }
  } catch { /* The site also works with storage disabled. */ }

  function save() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ enabled, x, y, active, visited: [...visited] })); } catch { /* Optional. */ }
  }

  function stopWalking() { clearTimeout(timer); timer = undefined; }

  function render() {
    player.style.left = `${x / 24 * 100}%`;
    player.style.top = `${y / 16 * 100}%`;
    player.dataset.moved = String(x !== 12 || y !== 8 || visited.size > 0);
    score.textContent = `${visited.size} / ${stops.length}`;
    score.setAttribute("aria-label", `${visited.size} of ${stops.length} places discovered`);
    hint.textContent = visited.size === stops.length ? "You found every corner. Nicely wandered." : "Six places. No hurry.";
    welcome.hidden = active !== null;
    for (const panel of panels) panel.hidden = panel.dataset.panel !== active;
    for (const landmark of landmarks) {
      const id = landmark.dataset.stop!;
      const stop = stops.find((item) => item.id === id)!;
      landmark.dataset.visited = String(visited.has(id));
      landmark.setAttribute("aria-label", `Walk to ${stop.name}${visited.has(id) ? " (discovered)" : ""}`);
      if (id === active) landmark.setAttribute("aria-current", "location");
      else landmark.removeAttribute("aria-current");
    }
  }

  function discover() {
    const nearby = stops.find((stop) => Math.abs(stop.x - x) + Math.abs(stop.y - y) <= 2);
    if (!nearby || active === nearby.id) return;
    const isNew = !visited.has(nearby.id);
    active = nearby.id;
    visited.add(nearby.id);
    if (isNew) {
      window.siteAnalytics?.track("world_place_discovered", { place_id: nearby.id, places_found: visited.size, input_method: inputMethod });
      if (visited.size === stops.length) window.siteAnalytics?.track("world_completed", { places_found: visited.size });
    }
    announcement.textContent = `${isNew ? "Discovered" : "Back at"} ${nearby.name}. ${visited.size} of ${stops.length} places found.${visited.size === stops.length ? " You found every corner!" : ""} Explore link below the map.`;
  }

  function move(direction: Direction) {
    if (!enabled) return;
    const [dx, dy] = vectors[direction];
    x = Math.max(1, Math.min(23, x + dx));
    y = Math.max(1, Math.min(14, y + dy));
    discover(); render(); save();
  }

  function setMode(on: boolean, focus = true, method = "button") {
    enabled = on;
    stopWalking();
    world!.hidden = !on;
    home!.hidden = on;
    toggle!.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Simple mode" : "Fun mode";
    if (focus) (on ? board : toggle)!.focus({ preventScroll: true });
    if (focus) window.siteAnalytics?.track("mode_changed", { mode: on ? "fun" : "simple", input_method: method });
    save();
  }

  toggle.hidden = false;
  render();
  setMode(enabled, false);
  toggle.addEventListener("click", () => setMode(!enabled));

  board.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    stopWalking();
    inputMethod = "keyboard";
    move(direction);
  });

  document.addEventListener("keydown", (event) => {
    if (enabled && event.key === "Escape") { event.preventDefault(); setMode(false, true, "keyboard"); }
  });

  for (const button of world.querySelectorAll<HTMLButtonElement>("[data-direction]")) {
    button.addEventListener("click", () => {
      inputMethod = "controls";
      stopWalking(); move(button.dataset.direction as Direction);
      board!.focus({ preventScroll: true });
    });
  }

  for (const landmark of landmarks) {
    landmark.addEventListener("click", () => {
      if (!enabled) return;
      inputMethod = "tap";
      stopWalking();
      const destination = stops.find((stop) => stop.id === landmark.dataset.stop)!;
      // Stop above the door so the character never covers its name.
      const targetY = destination.y - 2;
      const walk = () => {
        if (!enabled) return;
        if (reducedMotion.matches) {
          x = destination.x; y = targetY;
          discover(); render(); save();
        } else if (x !== destination.x) move(x < destination.x ? "right" : "left");
        else if (y !== targetY) move(y < targetY ? "down" : "up");
        else { discover(); render(); save(); }
        if (x !== destination.x || y !== targetY) timer = setTimeout(walk, 75);
      };
      walk();
      board!.focus({ preventScroll: true });
    });
  }

  world.querySelector<HTMLButtonElement>("#world-reset")!.addEventListener("click", () => {
    window.siteAnalytics?.track("world_restarted", { places_found: visited.size });
    stopWalking(); x = 12; y = 8; active = null; visited.clear();
    announcement.textContent = "A fresh walk. Zero of six places discovered.";
    render(); save(); board!.focus({ preventScroll: true });
  });

  // Never keep a walk running while the tab is in the background.
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopWalking(); });
  window.addEventListener("pagehide", stopWalking);
}
