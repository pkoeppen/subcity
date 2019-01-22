export default function ({ $axios, params, redirect, error }) {

  const slug = params.forward;
  if (!slug) return;

  const vars = { slug };
  const query = `
    query ($slug: String!) {
      resolveSlug (slug: $slug) {
        channel_id,
        syndicate_id,
      }
    }
  `;

  return $axios.post("/api/public", { query, vars })
  .then(({ data: { resolveSlug }}) => {

    if (resolveSlug && resolveSlug.channel_id) {
      return redirect(`/channels/${slug}`);
    }

    if (resolveSlug && resolveSlug.syndicate_id) {
      return redirect(`/syndicates/${slug}`);
    }

    return error({
      message: `Not found.`,
      statusCode: 404,
    });
  });
}