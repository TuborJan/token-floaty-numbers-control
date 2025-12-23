const MODULE_ID = "token-floaty-numbers-control";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "visibility", {
    name: "Floating Numbers Visibility",
    hint: "Determines who can see floating damage and healing numbers. This setting controls to whom the “Hidden Number Types” rules are applied. Requires “Scrolling Status Text” to be enabled. Status text is not affected.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      gmOnly: "Players only (GM always sees)",
      all: "Everyone",
      none: "Nobody"
    },
    default: "gmOnly"
  });

  game.settings.register(MODULE_ID, "hideNumbers", {
    name: "Hidden Number Types",
    hint: "Select which types of floating numbers will be hidden for users affected by the visibility setting. Has no effect if visibility is set to “Nobody”.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      both: "Damage and Healing",
      heal: "Healing only",
      damage: "Damage only"
    },
    default: "both"
  });
});


Hooks.once("ready", () => {
  if (!globalThis.libWrapper) {
    console.error(`${MODULE_ID} | libWrapper not available`);
    return;
  }

  console.log(`${MODULE_ID} | Ready`);

  libWrapper.register(
    MODULE_ID,
    "canvas.interface.createScrollingText",
    function (wrapped, origin, text, options = {}) {

      const visibility = game.settings.get(MODULE_ID, "visibility");
      const hideNumbers = game.settings.get(MODULE_ID, "hideNumbers");

      const isDamage = isNumericChange(text, "-");
      const isHealing = isNumericChange(text, "+");

      if(visibility === "none" && (isDamage || isHealing)) {
        return wrapped.call(this, origin, "", options);
      }

      if(visibility === "all" || (visibility === "gmOnly" && !game.user.isGM)) {
        if ((hideNumbers === "damage" || hideNumbers === "both") && isDamage) {
          return wrapped.call(this, origin, "", options);
        } else if ((hideNumbers === "heal" || hideNumbers === "both") && isHealing) {
          return wrapped.call(this, origin, "", options);
        }
        return wrapped.call(this, origin, text, options);
      }

      return wrapped.call(this, origin, text, options);
    },
    "WRAPPER"
  );
});

function isNumericChange(text, sign) {
  if (typeof text !== "string") return false;

  const t = normalizeMinus(text)
    .replace(/\s+/g, "")
    .trim();

  return sign === "+"
    ? /^\+\d+/.test(t)
    : /^-\d+/.test(t);
}

function normalizeMinus(str) {
  return str.replace(/[−–—]/g, "-");
}
