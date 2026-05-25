const axios = require('axios')
const Tool = require('../models/Tool')

async function fetchProductHuntTopic(topicUrl) {
  // If a full topic URL is provided, try to extract slug
  try {
    const token = process.env.PRODUCT_HUNT_TOKEN
    if (!token) {
      console.warn('No PRODUCT_HUNT_TOKEN provided; skipping Product Hunt API fetch')
      return
    }
    // Product Hunt API v2 requires GraphQL; as a fallback, fetch the public page and parse
    // Here we call the GraphQL API to fetch recent posts if token present
    const query = `query { posts(first:20) { edges { node { id name tagline discussion_url } } } }`
    const res = await axios.post('https://api.producthunt.com/v2/api/graphql', { query }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const posts = (res.data && res.data.data && res.data.data.posts && res.data.data.posts.edges) || []
    for (const edge of posts) {
      const node = edge.node
      const name = node.name
      if (!name) continue
      const slug = node.discussion_url ? node.discussion_url.split('/').pop() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const doc = {
        name,
        slug,
        description: node.tagline || '',
        url: node.discussion_url || '',
      }
      // Stage Product Hunt items for admin review
      const { stageDoc } = require('./stageHelper')
      await stageDoc('producthunt', doc)
      console.log('ProductHunt staged', slug)
    }
  } catch (err) {
    console.error('Product Hunt fetch failed', err.message)
  }
}

module.exports = fetchProductHuntTopic
