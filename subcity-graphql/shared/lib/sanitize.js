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

    alias (str, required=true) {

      // Must not be blank or longer than 38 characters.

      if (required && !str.length) {
        throw new Error("! Tier alias cannot be blank.");

      } else if (str.length > 38) {
        throw new Error("! Tier alias cannot be longer than 38 characters.");

      } else {
        return str;
      }
    },

    extra (int) {

      // Must be above 500 ($5.00) and under 999999 ($9,999.99).

      if (int < 500 || int > 999999) {
        throw new Error("! Invalid extra input.");
      
      } else {
        return int;
      }
    },

    funding (str) {

      // Must be (per_month|per_release).

      if (!/^(per_month|per_release)$/.test(str)) {
        throw new Error("! Invalid funding input.");
      
      } else {
        return str;
      }
    },

    slug (str) {

      // Must be URL-safe.

      const re = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$");

      if (!str.length || str.length > 38 || !re.test(str)) {
        throw new Error("! Invalid slug input.");

      } else {
        return str;
      }
    },

    tier (int) {

      // Must be 1, 2, or 3.

      if ([1, 2, 3].indexOf(int) < 0) {
        throw new Error("! Invalid tier input.");

      } else {
        return int;
      }
    },

    title (str) {

      // Title - Can be pretty much anything.

      if (!str.length || str.length > 38) {
        throw new Error("! Invalid title input.");

      } else {
        return str;
      }
    },

    updates (updates) {
      return sanitize(updates);
    },

    description (str, required=true) {

      // Description - Gets markdownified.

      if (required && !str.length) {
        throw new Error("! Description cannot be blank.");

      } else if (str.length > 500) {
        throw new Error("! Description cannot be more than 500 characters long.");

      } else {

        try {
          const html = md.renderInline(str);
          return ({ raw: str, rendered: html });

        } catch(error) {
          throw new Error("! Invalid description markdown input.");
        }
      }
    },

    funding(str) {

      // Funding type - Must be "per_month" or "per_release".

      if (!/^(per_month|per_release)$/.test(str)) {
        throw new Error("! Invalid funding type input.");

      } else {
        return str;
      }
    },

    links({ _1, _2, _3 }) {

      // Links (with titles) - Can be URLs, titles can be just about anything.

      return ({

        _1: {
          title: _1 ? this.title(_1.title) : null,
          url: _1 ? this.url(_1.url) : null
        },

        _2: {
          title: _2 ? this.title(_2.title) : null,
          url: _2 ? this.url(_2.url) : null
        },

        _3: {
          title: _3 ? this.title(_3.title) : null,
          url: _3 ? this.url(_3.url) : null
        }

      });
    },

    url(url) {

      // TODO: Sanitize URLs

      return url;
    },

    overview(str) {

      // Overview - Gets markdownified.

      if (!str.length || str.length > 2000) {
        throw new Error("! Invalid overview input.");

      } else {

        try {
          const html = md.render(str);
          return ({ raw: str, rendered: html });

        } catch(error) {
          throw new Error("! Invalid overview markdown input.");
        }
      }
    },

    payload(str) {

      if (!str) {
        return null;
      }

      // Payload filename - Can"t be insanely long or have sketchy characters.

      if (!str.length || str.length > 200) {
        throw new Error("! Invalid payload filename input.");

      } else {
        return sanitizeFilename(str.replace(/\s/g, "_"));
      }
    },

    per_release(int) {
      return this.rate(int);
    },

    rate(int) {

      const possible_values = (new Array(20)).fill(0).map((_, index) => {

        // Returns [499, 999, 1499, 1999, ... 9999]

        return (index + 1) * 500 - 1;
      });

      if (possible_values.indexOf(int) < 0) {
        throw new Error("! Invalid rate input.");

      } else {
        return int;
      }
    },

    tiers({ _1, _2, _3 }) {

      // If the tier is active, text fields cannot be blank.

      return ({

        _1: {
          active: true,
          alias: this.alias(_1.alias),
          description: this.description(_1.description),
          rate: this.rate(_1.rate)
        },

        _2: {
          active: _2.active,
          alias: this.alias(_2.alias, _2.active),
          description: this.description(_2.description, _2.active),
          rate: this.rate(_2.rate)
        },

        _3: {
          active: _3.active,
          alias: this.alias(_3.alias, _3.active),
          description: this.description(_3.description, _3.active),
          rate: this.rate(_3.rate)
        }

      });
    },

    syndicate_id(str) {
      if (!/^[a-z0-9]{16}$/i.test(str)) {
        throw new Error("! Invalid syndicate ID input.");
      } else {
        return str;
      }
    }

  };

  // Apply rules where applicable.
  
  return mapValues(data, (value, key, object) => {
    return rules[key] ? rules[key](value) : value;
  });
}
