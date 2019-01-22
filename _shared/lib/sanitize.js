const sanitizeFilename = require("sanitize-filename");
const emoji = require("markdown-it-emoji");
const md    = require("markdown-it")
              ({ linkify: true })
              .use(emoji)
              .disable(["image"]);
const { mapValues } = require("lodash");


////////////////////////////////////////////////////


const sanitize = (data) => {

  // Rules for sanitizing String-type inputs.
  // All other type- and null-checking is handled automatically by GraphQL.

  const rules = {

    slug(str) {

      // Slug - Must be URL-safe.

      const re = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$");
      if (!str.length || str.length > 38 || !re.test(str)) {
        throw new Error("Slug input invalid.");
      } else {
        return str;
      }
    },

    title(str) {

      // Title - Can be pretty much anything.

      if (!str.length || str.length > 38) {
        throw new Error("Title input invalid.");
      } else {
        return str;
      }
    },

    description(str) {

      // Description - Gets markdownified.

      if (!str.length || str.length > 500) {
        throw new Error("Description input invalid.");
      } else {
        try {
          const html = md.renderInline(str);
          return JSON.stringify({ raw: str, rendered: html });
        } catch(error) {
          throw new Error("Markdown input invalid.");
        }
      }
    },

    overview(str) {

      // Overview - Gets markdownified.

      if (!str.length || str.length > 2000) {
        throw new Error("Overview input invalid.");
      } else {
        try {
          const html = md.render(str);
          return JSON.stringify({ raw: str, rendered: html });
        } catch(error) {
          throw new Error("Markdown input invalid.");
        }
      }
    },

    payload_url(str) {
      if (!str) return null;

      // Payload filename - Can"t be insanely long or have sketchy characters.

      if (!str.length || str.length > 200) {
        throw new Error("Payload input invalid.");
      } else {
        return sanitizeFilename(str.replace(/\s/g, "_"));
      }
    },

    subscription_rate(int) {
      const possible_values = (new Array(20)).fill(0).map((_, index) => {

        // Returns [499, 999, 1499, 1999, ... 9999]

        return (index + 1) * 500 - 1;
      });
      if (possible_values.indexOf(int) < 0) {
        throw new Error("Subscription rate input invalid.");
      } else {
        return int;
      }
    },

    _channel_id(str) {
      if (!/^[a-z0-9]{16}$/i.test(str)) {
        throw new Error("Channel ID input invalid.");
      } else {
        return str;
      }
    },

    syndicate_id(str) {
      if (!/^[a-z0-9]{16}$/i.test(str)) {
        throw new Error("Syndicate ID input invalid.");
      } else {
        return str;
      }
    },

    _syndicate_id(str) {
      if (!/^[a-z0-9]{16}$/i.test(str)) {
        throw new Error("Syndicate ID input invalid.");
      } else {
        return str;
      }
    }

  };

  // Apply rules where applicable.
  
  return mapValues(data, (value, key, object) => {
    return rules[key] ? rules[key](value) : value;
  });
};


////////////////////////////////////////////////////


module.exports = sanitize;