const sanitizeFilename = require("sanitize-filename");
const emoji = require("markdown-it-emoji");
const md    = require("markdown-it")
              ({ linkify: true })
              .use(emoji)
              .disable(["image"]);
const mapValues = require("lodash/mapValues");


module.exports = {
  sanitize
};


function sanitize (data) {

  // Rules for sanitizing inputs.
  // Initial type-checking is handled automatically by GraphQL.

  const rules = {

    address (address) {

      Object.keys(address).map(key => {
        if (address[key].length > 200) {
          throw new Error("![400] Address input too long.");
        }
      });

      return address;
    },

    alias (str) {
      if (!str.length) {
        return null;
      }
    },

    title (str, max=30) {

      if (!str || !str.length) {
        throw new Error("![400] Title cannot be blank.");

      } else if (str.length > max) {
        throw new Error(`![400] Title cannot be longer than ${max} characters.`);

      } else {
        return str;
      }
    },

    extra (int) {

      if ((typeof int !== "number") || int < 0 || int > 999999) {
        throw new Error("![400] Invalid extra input.");

      } else {
        return int;
      }
    },

    funding (str) {

      if (!/^(per_month|per_release)$/.test(str)) {
        throw new Error("![400] Invalid funding input.");
      
      } else {
        return str;
      }
    },

    slug (str) {

      // Must be URL-safe.

      const re = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$");

      if (!str || str.length > 30 || !re.test(str)) {
        throw new Error("![400] Invalid slug input.");

      } else {
        return str;
      }
    },

    tier (int) {

      if ([1, 2, 3].indexOf(int) < 0) {
        throw new Error("![400] Invalid tier input.");

      } else {
        return int;
      }
    },

    updates (updates) {

      return sanitize(updates);
    },

    description (str, max=5000, inline=false) {

      // Gets markdownified.

      if (!str || !str.length) {
        throw new Error("![400] Description cannot be blank.");

      } else if (str.length > max) {
        throw new Error(`![400] Description cannot be more than ${max} characters long.`);

      } else {

        try {
          const html = inline ? md.renderInline(str) : md.render(str);
          return ({ raw: str, rendered: html });

        } catch(error) {
          throw new Error("![400] Invalid description markdown input.");
        }
      }
    },

    links(obj) {

      // Links - Can be URLs.

      // TODO

      return obj;
    },

    payload(str) {

      if (!str) {
        return null;
      }

      // Can't be insanely long or have sketchy characters.

      if (!str.length || str.length > 200) {
        throw new Error("![400] Invalid payload filename input.");

      } else {
        return sanitizeFilename(str.replace(/\s/g, "_"));
      }
    },

    per_release(int) {
      return this.rate(int);
    },

    rate(int) {

      if ((typeof int !== "number") || int < 499 || int > 999999) {
        throw new Error("![400] Invalid rate input.");

      } else {
        return int;
      }
    },

    tiers (tiers) {

      if (tiers.hasOwnProperty("_1")) {
        if (tiers._1.hasOwnProperty("active")) tiers._1.active = true;
        if (tiers._1.hasOwnProperty("title")) tiers._1.title = this.title(tiers._1.title, 30);
        if (tiers._1.hasOwnProperty("description")) tiers._1.description = this.description(tiers._1.description, 300, true);
        if (tiers._1.hasOwnProperty("rate")) tiers._1.rate = this.rate(tiers._1.rate);
      }

      if (tiers.hasOwnProperty("_2")) {
        if (tiers._2.hasOwnProperty("active")) tiers._2.active = !!tiers._2.active;
        if (tiers._2.hasOwnProperty("title")) tiers._2.title = this.title(tiers._2.title, 30);
        if (tiers._2.hasOwnProperty("description")) tiers._2.description = this.description(tiers._2.description, 300, true);
        if (tiers._2.hasOwnProperty("rate")) tiers._2.rate = this.rate(tiers._2.rate);
      }

      if (tiers.hasOwnProperty("_3")) {
        if (tiers._3.hasOwnProperty("active")) tiers._3.active = !!tiers._3.active;
        if (tiers._3.hasOwnProperty("title")) tiers._3.title = this.title(tiers._3.title, 30);
        if (tiers._3.hasOwnProperty("description")) tiers._3.description = this.description(tiers._3.description, 300, true);
        if (tiers._3.hasOwnProperty("rate")) tiers._3.rate = this.rate(tiers._3.rate);
      }

      return tiers;
    },
  };

  // Apply rules where applicable.
  
  return mapValues(data, (value, key, object) => {
    return rules[key] ? rules[key](value) : value;
  });
}
