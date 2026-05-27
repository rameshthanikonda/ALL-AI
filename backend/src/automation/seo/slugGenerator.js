const slugify = require('slugify')

function generateSlug(name) {
  if (!name) return ''
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true
  })
}

module.exports = {
  generateSlug
}
