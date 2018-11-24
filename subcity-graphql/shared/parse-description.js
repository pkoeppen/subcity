const parseDescription = (description, raw=false) => {
  try {
  	return JSON.parse(description)[raw ? "raw" : "rendered"];
  } catch(error) {

  	// Description is null.

    return description;
  }
}

////////////////////////////////////////////////////

module.exports = parseDescription;