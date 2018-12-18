const parseMarkdown = (str, raw=false) => {
  try {
  	return JSON.parse(str)[raw ? "raw" : "rendered"];
  } catch(error) {

  	// Description is null.

    return str;
  }
}

////////////////////////////////////////////////////

module.exports = parseMarkdown;