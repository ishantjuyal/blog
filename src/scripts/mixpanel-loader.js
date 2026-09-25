// Existing Mixpanel CDN bootstrap, kept separate from event classification.
export function loadMixpanelLibrary() {
      if (window.mixpanel?.__SV) return;

      const mixpanel = window.mixpanel || [];
      window.mixpanel = mixpanel;
      mixpanel._i = [];
      mixpanel.__SV = 1.2;

      mixpanel.init = function initMixpanelStub(projectToken, config, name) {
        function stub(target, methodPath) {
          const parts = methodPath.split(".");
          if (parts.length === 2) {
            target = target[parts[0]];
            methodPath = parts[1];
          }

          target[methodPath] = function queueMixpanelCall() {
            target.push([methodPath].concat(Array.prototype.slice.call(arguments, 0)));
          };
        }

        let instance = mixpanel;
        if (typeof name !== "undefined") {
          instance = mixpanel[name] = [];
        } else {
          name = "mixpanel";
        }

        instance.people = instance.people || [];
        instance.toString = function mixpanelToString(usePeople) {
          let value = name;
          if (name !== "mixpanel") value = `mixpanel.${name}`;
          if (!usePeople) value += " (stub)";
          return value;
        };
        instance.people.toString = function peopleToString() {
          return `${instance.toString(1)}.people (stub)`;
        };

        [
          "disable",
          "time_event",
          "track",
          "track_pageview",
          "track_links",
          "track_forms",
          "register",
          "register_once",
          "alias",
          "unregister",
          "identify",
          "name_tag",
          "set_config",
          "reset",
          "opt_in_tracking",
          "opt_out_tracking",
          "has_opted_in_tracking",
          "has_opted_out_tracking",
          "clear_opt_in_out_tracking",
          "start_batch_senders",
          "people.set",
          "people.set_once",
          "people.unset",
          "people.increment",
          "people.append",
          "people.union",
          "people.track_charge",
          "people.clear_charges",
          "people.delete_user",
          "people.remove",
        ].forEach((methodPath) => stub(instance, methodPath));

        mixpanel._i.push([projectToken, config, name]);
      };

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
      document.head.appendChild(script);
    }
