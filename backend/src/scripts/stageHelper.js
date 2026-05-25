const StagedTool = require('../models/StagedTool')

async function stageDoc(source, doc) {
  const name = doc.name || ''
  const slug = doc.slug || (name && String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  const normalized = {
    name: doc.name,
    slug,
    description: doc.description || '',
    url: doc.url || '',
    category: doc.category || '',
    tags: Array.isArray(doc.tags) ? doc.tags : String(doc.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    logoUrl: doc.logoUrl || doc.logo || '',
    source: source || '',
    enterprise: Boolean(doc.enterprise),
    status: 'pending',
    stagedAt: new Date(),
  }

  await StagedTool.updateOne({ slug }, { $set: normalized }, { upsert: true })
  console.log('Staged', slug)
}

module.exports = { stageDoc }
